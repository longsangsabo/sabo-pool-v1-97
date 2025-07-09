import { supabase } from '@/integrations/supabase/client';
import type { Tournament } from '@/types/common';

export interface TournamentRegistrationData {
  tournament_id: string;
  player_id: string;
  registration_status?: string;
  payment_status?: string;
  status?: string;
  registration_date?: string;
}

export interface TournamentResultData {
  tournament_id: string;
  player_id: string;
  final_position: number;
  elo_earned: number;
  spa_earned: number;
  prize_money?: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
}

export class TournamentRepository {
  /**
   * Get tournament by ID with optimized query
   */
  static async getTournamentById(id: string) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        current_participants:tournament_registrations(count),
        tournament_registrations!inner(
          id,
          player_id,
          registration_status,
          payment_status,
          status,
          registration_date,
          profiles!inner(
            user_id,
            full_name,
            display_name,
            verified_rank
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all tournaments with pagination and filters
   */
  static async getTournaments(options: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    let query = supabase
      .from('tournaments')
      .select(`
        *,
        tournament_registrations(count)
      `)
      .order('tournament_start', { ascending: true });

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Create new tournament
   */
  static async createTournament(tournamentData: any) {
    const { data, error } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update tournament
   */
  static async updateTournament(id: string, updates: Partial<Tournament>) {
    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete tournament
   */
  static async deleteTournament(id: string) {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Register player for tournament
   */
  static async registerPlayer(registrationData: TournamentRegistrationData) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: registrationData.tournament_id,
        player_id: registrationData.player_id,
        registration_status: registrationData.registration_status || 'pending',
        payment_status: registrationData.payment_status || 'unpaid',
        status: registrationData.status || 'pending',
        registration_date: registrationData.registration_date || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update tournament participant count
    await this.updateParticipantCount(registrationData.tournament_id);

    return data;
  }

  /**
   * Cancel tournament registration
   */
  static async cancelRegistration(tournamentId: string, playerId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .select();

    if (error) throw error;

    // Update tournament participant count
    await this.updateParticipantCount(tournamentId);

    return data;
  }

  /**
   * Get tournament registrations
   */
  static async getTournamentRegistrations(tournamentId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        profiles!inner(
          user_id,
          full_name,
          display_name,
          avatar_url,
          verified_rank
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('registration_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if user is registered for tournament
   */
  static async checkUserRegistration(tournamentId: string, playerId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update tournament results - batch update ELO/SPA points
   */
  static async updateTournamentResults(tournamentId: string, results: TournamentResultData[]) {
    // For now, process results individually since we don't have the RPC function
    const processedResults = [];
    
    for (const result of results) {
      // Update player rankings with new ELO/SPA
      const { data: updatedRanking, error } = await supabase
        .from('player_rankings')
        .upsert({
          player_id: result.player_id,
          elo_points: result.elo_earned,
          spa_points: result.spa_earned,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      processedResults.push(updatedRanking);
    }

    return processedResults;
  }

  /**
   * Generate tournament bracket
   */
  static async generateBracket(tournamentId: string, seedingMethod: string = 'elo_ranking') {
    const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
      p_tournament_id: tournamentId,
      p_seeding_method: seedingMethod,
      p_force_regenerate: false
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get tournament bracket
   */
  static async getTournamentBracket(tournamentId: string) {
    const { data, error } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update participant count for tournament
   */
  private static async updateParticipantCount(tournamentId: string) {
    const { count, error } = await supabase
      .from('tournament_registrations')
      .select('id', { count: 'exact' })
      .eq('tournament_id', tournamentId);

    if (error) throw error;

    await supabase
      .from('tournaments')
      .update({ 
        current_participants: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId);
  }

  /**
   * Get tournaments by status with real-time updates
   */
  static async getTournamentsByStatus(status: string[]) {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_registrations(count)
      `)
      .in('status', status)
      .order('tournament_start', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Auto-update tournament status based on dates
   */
  static async autoUpdateTournamentStatus() {
    const { data, error } = await supabase.rpc('auto_update_tournament_status');
    if (error) throw error;
    return data;
  }
}