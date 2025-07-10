import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentUtils {
  isLoading: boolean;
  createQuickTournament: (params: any) => Promise<string | null>;
  generateBracket: (tournamentId: string) => Promise<boolean>;
  addUsersToTournament: (tournamentId: string, userIds: string[]) => Promise<boolean>;
  deleteTournament: (tournamentId: string) => Promise<boolean>;
  releaseDemoUsers: (tournamentId: string) => Promise<boolean>;
}

export const useTournamentUtils = (): TournamentUtils => {
  const [isLoading, setIsLoading] = useState(false);

  const createQuickTournament = async (params: any): Promise<string | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: params.name,
          description: params.description || 'Quick test tournament',
          tournament_type: params.type || 'single_elimination',
          format: params.format || 'race_to_5',
          max_participants: params.maxParticipants || 16,
          entry_fee: params.entryFee || 0,
          registration_start: new Date().toISOString(),
          registration_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tournament_start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          tournament_end: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming',
          venue: params.venue || 'Test Venue',
          city: params.city || 'Hồ Chí Minh',
          district: params.district || 'Quận 1',
          created_by: params.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Tournament "${data.name}" created successfully`);
      return data.id;
    } catch (error: any) {
      toast.error(`Failed to create tournament: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateBracket = async (tournamentId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: tournamentId,
        p_seeding_method: 'elo_ranking',
        p_force_regenerate: true
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast.error(data.error as string);
        return false;
      }

      toast.success('Tournament bracket generated successfully');
      return true;
    } catch (error: any) {
      toast.error(`Failed to generate bracket: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addUsersToTournament = async (tournamentId: string, userIds: string[]): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('admin_add_users_to_tournament', {
        p_tournament_id: tournamentId,
        p_user_ids: userIds,
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_notes: 'Added via development tools'
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        toast.error((data as any).error || 'Failed to add users');
        return false;
      }

      toast.success(`Added ${(data as any).added_count || 0} users to tournament`);
      return true;
    } catch (error: any) {
      toast.error(`Failed to add users: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTournament = async (tournamentId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // First release demo users
      await releaseDemoUsers(tournamentId);
      
      // Delete tournament registrations
      await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete tournament matches
      await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete tournament brackets
      await supabase
        .from('tournament_brackets')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete tournament seeding
      await supabase
        .from('tournament_seeding')
        .delete()
        .eq('tournament_id', tournamentId);

      // Finally delete tournament
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) throw error;

      toast.success('Tournament deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(`Failed to delete tournament: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const releaseDemoUsers = async (tournamentId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('release_demo_users', {
        tournament_id: tournamentId
      });

      if (error) throw error;

      toast.success((data as any).message || 'Demo users released successfully');
      return true;
    } catch (error: any) {
      toast.error(`Failed to release demo users: ${error.message}`);
      return false;
    }
  };

  return {
    isLoading,
    createQuickTournament,
    generateBracket,
    addUsersToTournament,
    deleteTournament,
    releaseDemoUsers
  };
};