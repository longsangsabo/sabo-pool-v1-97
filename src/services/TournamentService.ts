import { supabase } from '@/integrations/supabase/client';
import { TournamentFormData, EnhancedTournament, TournamentRegistration } from '@/types/tournament-extended';
import { TournamentStatus, TournamentType, GameFormat, TournamentTier } from '@/types/tournament-enums';
import { RewardsService } from './RewardsService';
import { ValidationService } from './ValidationService';
import { toast } from 'sonner';

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(data: TournamentFormData): Promise<EnhancedTournament | null> {
    try {
      // Validate data first
      const validation = ValidationService.validateTournamentData(data);
      if (!validation.isValid) {
        toast.error('Dữ liệu không hợp lệ');
        console.error('Validation errors:', validation.errors);
        return null;
      }

      // Calculate rewards if not provided
      if (!data.rewards) {
        data.rewards = RewardsService.calculateRewards(
          data.tier_level,
          data.entry_fee,
          data.max_participants,
          data.game_format
        );
      }

      // Prepare tournament data for database
      const tournamentData = {
        name: data.name,
        description: data.description,
        tournament_type: data.tournament_type,
        game_format: data.game_format,
        tier_level: data.tier_level,
        max_participants: data.max_participants,
        current_participants: 0,
        registration_start: data.registration_start,
        registration_end: data.registration_end,
        tournament_start: data.tournament_start,
        tournament_end: data.tournament_end,
        venue_address: data.venue_address,
        entry_fee: data.entry_fee,
        prize_pool: data.rewards.totalPrize,
        status: data.is_public ? TournamentStatus.OPEN : TournamentStatus.DRAFT,
        rules: data.rules,
        contact_info: data.contact_info,
        is_public: data.is_public,
        requires_approval: data.requires_approval,
        eligible_ranks: data.eligible_ranks,
        allow_all_ranks: data.allow_all_ranks,
        min_rank_requirement: data.min_rank_requirement,
        max_rank_requirement: data.max_rank_requirement,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert tournament
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert(tournamentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating tournament:', error);
        toast.error('Có lỗi xảy ra khi tạo giải đấu');
        return null;
      }

      // Store rewards data separately if needed
      await this.storeRewardsData(tournament.id, data.rewards);

      toast.success('Tạo giải đấu thành công!');
      
      return this.enhanceTournamentData(tournament);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast.error('Có lỗi xảy ra khi tạo giải đấu');
      return null;
    }
  }

  /**
   * Update existing tournament
   */
  static async updateTournament(id: string, data: Partial<TournamentFormData>): Promise<EnhancedTournament | null> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tournament:', error);
        toast.error('Có lỗi xảy ra khi cập nhật giải đấu');
        return null;
      }

      // Update rewards if provided
      if (data.rewards) {
        await this.storeRewardsData(id, data.rewards);
      }

      toast.success('Cập nhật giải đấu thành công!');
      
      return this.enhanceTournamentData(tournament);
    } catch (error) {
      console.error('Failed to update tournament:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giải đấu');
      return null;
    }
  }

  /**
   * Get tournament by ID with full details
   */
  static async getTournamentById(id: string): Promise<EnhancedTournament | null> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          club_profiles (
            id,
            club_name,
            address
          ),
          tournament_registrations (
            id,
            player_id,
            registration_status,
            payment_status,
            registration_date,
            profiles (
              id,
              full_name,
              display_name,
              current_rank,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error || !tournament) {
        console.error('Error fetching tournament:', error);
        return null;
      }

      return this.enhanceTournamentData(tournament);
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      return null;
    }
  }

  /**
   * Get tournaments with filters and pagination
   */
  static async getTournaments(filters: {
    status?: TournamentStatus[];
    tier_level?: TournamentTier[];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tournaments: EnhancedTournament[]; total: number }> {
    try {
      let query = supabase
        .from('tournaments')
        .select(`
          *,
          club_profiles (
            id,
            club_name,
            address
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.tier_level && filters.tier_level.length > 0) {
        query = query.in('tier_level', filters.tier_level);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data: tournaments, error, count } = await query;

      if (error) {
        console.error('Error fetching tournaments:', error);
        return { tournaments: [], total: 0 };
      }

      const enhancedTournaments = tournaments?.map(t => this.enhanceTournamentData(t)) || [];

      return {
        tournaments: enhancedTournaments,
        total: count || 0,
      };
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      return { tournaments: [], total: 0 };
    }
  }

  /**
   * Delete tournament
   */
  static async deleteTournament(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tournament:', error);
        toast.error('Có lỗi xảy ra khi xóa giải đấu');
        return false;
      }

      toast.success('Xóa giải đấu thành công!');
      return true;
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      toast.error('Có lỗi xảy ra khi xóa giải đấu');
      return false;
    }
  }

  /**
   * Register player for tournament
   */
  static async registerPlayer(tournamentId: string, playerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: playerId,
          registration_status: 'confirmed',
          payment_status: 'pending',
          registration_date: new Date().toISOString(),
        });

      if (error) {
        console.error('Error registering player:', error);
        toast.error('Có lỗi xảy ra khi đăng ký tham gia');
        return false;
      }

      // Update participant count
      await this.updateParticipantCount(tournamentId);

      toast.success('Đăng ký tham gia thành công!');
      return true;
    } catch (error) {
      console.error('Failed to register player:', error);
      toast.error('Có lỗi xảy ra khi đăng ký tham gia');
      return false;
    }
  }

  /**
   * Update tournament status
   */
  static async updateTournamentStatus(id: string, status: TournamentStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating tournament status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update tournament status:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private static async storeRewardsData(tournamentId: string, rewards: any): Promise<void> {
    try {
      // Store rewards data in a separate table or as JSON in the main table
      // This is a placeholder - implement based on your schema
      // Store rewards data as JSON in tournaments table for now
      const { error } = await supabase
        .from('tournaments')
        .update({
          rewards_data: rewards,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tournamentId);

      if (error) {
        console.error('Error storing rewards data:', error);
      }
    } catch (error) {
      console.error('Failed to store rewards data:', error);
    }
  }

  private static async updateParticipantCount(tournamentId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      await supabase
        .from('tournaments')
        .update({ 
          current_participants: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);
    } catch (error) {
      console.error('Failed to update participant count:', error);
    }
  }

  private static enhanceTournamentData(tournament: any): EnhancedTournament {
    const now = new Date();
    const tournamentStart = new Date(tournament.tournament_start);
    const registrationStart = new Date(tournament.registration_start);
    const registrationEnd = new Date(tournament.registration_end);

    // Calculate registration status
    let registrationStatus: 'not_started' | 'open' | 'closed' | 'ended';
    if (now < registrationStart) {
      registrationStatus = 'not_started';
    } else if (now >= registrationStart && now <= registrationEnd) {
      registrationStatus = 'open';
    } else if (now > registrationEnd && now < tournamentStart) {
      registrationStatus = 'closed';
    } else {
      registrationStatus = 'ended';
    }

    // Calculate available slots
    const availableSlots = tournament.max_participants - (tournament.current_participants || 0);

    // Calculate time until start
    const timeUntilStart = tournamentStart > now 
      ? this.formatTimeUntil(tournamentStart)
      : undefined;

    return {
      ...tournament,
      available_slots: availableSlots,
      registration_status: registrationStatus,
      time_until_start: timeUntilStart,
      rewards: tournament.rewards || RewardsService.calculateRewards(
        tournament.tier_level,
        tournament.entry_fee,
        tournament.max_participants,
        tournament.game_format
      ),
    };
  }

  private static formatTimeUntil(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ`;
    } else {
      return 'Sắp bắt đầu';
    }
  }
}