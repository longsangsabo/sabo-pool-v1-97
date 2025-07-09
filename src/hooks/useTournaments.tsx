import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  Tournament,
  TournamentFormData,
} from '../types/common';
import {
  TournamentRegistration,
  TournamentMatch,
  TournamentResult,
  TournamentFilters,
  TournamentTier,
  TOURNAMENT_TIERS,
} from '../types/tournament';
// Import new service layer
import { RankingService } from '@/services/rankingService';
import { TournamentRepository } from '@/repositories/tournamentRepository';
import { TOURNAMENT_STATUS } from '@/constants/tournamentConstants';

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  registration_date: Date;
  status: 'registered' | 'confirmed' | 'eliminated' | 'winner';
  seed?: number;
  final_rank?: number;
}

export interface TournamentBracket {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  score?: string;
  scheduled_time?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CreateTournamentData {
  name: string;
  description: string;
  tournament_type: Tournament['tournament_type'];
  game_format: Tournament['game_format'];
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  venue_name: string;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  rules: string;
  venue_address?: string;
}

export const useTournaments = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use TournamentRepository instead of direct Supabase calls
      const data = await TournamentRepository.getTournaments({
        limit: 100 // Default limit
      });
      
      // Map database response to Tournament type
      const mappedTournaments = (data || []).map(tournament => ({
        ...tournament,
        organizer_id: tournament.created_by,
        tournament_type: tournament.tournament_type as Tournament['tournament_type'],
        game_format: tournament.game_format as Tournament['game_format'],
        status: tournament.status as Tournament['status'],
      }));
      
      setTournaments(mappedTournaments as Tournament[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createTournament = useCallback(
    async (data: CreateTournamentData) => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) throw new Error('Must be logged in');

        // Map tier letter to tier level
        const tierLevelMap: Record<string, number> = {
          'K+': 1, 'K': 1,
          'I+': 1, 'I': 1,
          'H+': 2, 'H': 2,
          'G+': 2, 'G': 2,
          'F+': 3, 'F': 3,
          'E+': 4, 'E': 4,
        };

        const { data: newTournament, error } = await supabase
          .from('tournaments')
          .insert({
            name: data.name,
            description: data.description,
            tournament_type: data.tournament_type,
            game_format: data.game_format,
            max_participants: data.max_participants,
            tournament_start: data.tournament_start,
            tournament_end: data.tournament_end,
            registration_start: data.registration_start,
            registration_end: data.registration_end,
            entry_fee: data.entry_fee,
            prize_pool: data.prize_pool,
            first_prize: Math.floor(data.prize_pool * 0.5),
            second_prize: Math.floor(data.prize_pool * 0.3),
            third_prize: Math.floor(data.prize_pool * 0.2),
            venue_address: data.venue_address,
            venue_name: data.venue_name,
            rules: data.rules,
            created_by: user.id,
            status: 'upcoming',
            is_public: true,
            tier_level: tierLevelMap[(data as any).tier] || 1,
            requires_qualification: tierLevelMap[(data as any).tier] >= 3,
            elo_multiplier: tierLevelMap[(data as any).tier] || 1,
          })
          .select()
          .single();

        if (error) throw error;

        // Refresh tournaments list
        await fetchTournaments();
        toast.success('Giải đấu đã được tạo thành công!');
        return newTournament;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create tournament'
        );
        toast.error('Có lỗi xảy ra khi tạo giải đấu');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchTournaments]
  );

  const updateTournament = useCallback(
    async (id: string, updates: Partial<Tournament>) => {
      setLoading(true);
      setError(null);

      try {
        // Mock update tournament
        const updatedTournament = { ...tournaments.find(t => t.id === id), ...updates };
        setTournaments(prev => prev.map(t => (t.id === id ? updatedTournament as Tournament : t)));
        return updatedTournament;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update tournament'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tournaments]
  );

  const deleteTournament = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Mock delete tournament
      setTournaments(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete tournament'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerForTournament = useCallback(
    async (tournamentId: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) throw new Error('Must be logged in');

        // Use TournamentRepository instead of direct Supabase calls
        const data = await TournamentRepository.registerPlayer({
          tournament_id: tournamentId,
          player_id: user.id,
          registration_status: 'pending',
          payment_status: 'unpaid',
          status: 'pending'
        });

        // Update local tournaments list
        setTournaments(prev =>
          prev.map(tournament =>
            tournament.id === tournamentId
              ? {
                  ...tournament,
                  current_participants: tournament.current_participants + 1,
                }
              : tournament
          )
        );

        toast.success('Đăng ký giải đấu thành công!');
        return data;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to register for tournament'
        );
        toast.error('Có lỗi khi đăng ký giải đấu');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const cancelRegistration = useCallback(
    async (tournamentId: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) throw new Error('Must be logged in');

        console.log('Attempting to cancel registration for tournament:', tournamentId, 'user:', user.id);
        
        // Use TournamentRepository instead of direct Supabase calls
        const data = await TournamentRepository.cancelRegistration(tournamentId, user.id);

        console.log('Delete result:', data);

        if (!data || data.length === 0) {
          console.warn('No registration found to delete - updating UI state anyway');
          toast.success('Đã hủy đăng ký giải đấu');
        } else {
          console.log('Successfully deleted registration:', data[0]);
          toast.success('Đã hủy đăng ký giải đấu');
        }

        setTournaments(prev =>
          prev.map(tournament =>
            tournament.id === tournamentId
              ? {
                  ...tournament,
                  current_participants: Math.max(
                    0,
                    tournament.current_participants - 1
                  ),
                }
              : tournament
          )
        );
      } catch (err) {
        console.error('Cancel registration error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to cancel registration'
        );
        toast.error('Có lỗi khi hủy đăng ký');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const getTournamentRegistrations = useCallback(
    async (tournamentId: string) => {
      try {
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
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch registrations'
        );
        return [];
      }
    },
    []
  );

  const checkUserRegistration = useCallback(
    async (tournamentId: string) => {
      try {
        if (!user?.id) return null;

        const { data, error } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('player_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } catch (err) {
        return null;
      }
    },
    [user?.id]
  );

  const createTournamentMatch = useCallback(
    async (matchData: Partial<TournamentMatch>) => {
      setLoading(true);
      setError(null);

      try {
        // Mock create match
        const mockMatch = {
          id: Date.now().toString(),
          ...matchData,
        };
        console.log('Mock creating tournament match:', mockMatch);
        return mockMatch;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create match');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateMatchResult = useCallback(
    async (matchId: string, result: Partial<TournamentMatch>) => {
      setLoading(true);
      setError(null);

      try {
        // Mock update match result
        console.log('Mock updating match result:', { matchId, result });
        return { id: matchId, ...result };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update match result'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createTournamentResult = useCallback(
    async (resultData: Partial<TournamentResult>) => {
      setLoading(true);
      setError(null);

      try {
        // Mock create tournament result
        const mockResult = {
          id: Date.now().toString(),
          ...resultData,
        };
        console.log('Mock creating tournament result:', mockResult);
        return mockResult;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to create tournament result'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const calculateEloPoints = useCallback(
    (tierCode: string, position: number): number => {
      // Use new RankingService instead of hardcoded logic
      const tournamentPosition = RankingService.getTournamentPositions().find(pos => {
        if (pos === 'CHAMPION') return position === 1;
        if (pos === 'RUNNER_UP') return position === 2;
        if (pos === 'THIRD_PLACE') return position === 3;
        if (pos === 'FOURTH_PLACE') return position === 4;
        if (pos === 'TOP_8') return position <= 8;
        if (pos === 'TOP_16') return position <= 16;
        return true; // PARTICIPATION
      }) || 'PARTICIPATION';

      return RankingService.calculateTournamentElo(tournamentPosition);
    },
    []
  );

  const getTournamentTiers = useCallback(async () => {
    try {
      // Mock tournament tiers
      return TOURNAMENT_TIERS;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournament tiers'
      );
      return TOURNAMENT_TIERS;
    }
  }, []);

  const getTournamentResults = useCallback(async (tournamentId: string) => {
    try {
      // Mock tournament results
      return [];
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch tournament results'
      );
      return [];
    }
  }, []);

  const finalizeTournament = useCallback(
    async (
      tournamentId: string,
      results: Array<{
        user_id: string;
        final_position: number;
        prize_money?: number;
        matches_played: number;
        matches_won: number;
        matches_lost: number;
      }>
    ) => {
      setLoading(true);
      setError(null);

      try {
        // Mock finalize tournament
        console.log('Mock finalizing tournament:', { tournamentId, results });
        
        // Update tournament status to completed
        setTournaments(prev =>
          prev.map(tournament =>
            tournament.id === tournamentId
              ? { ...tournament, status: 'completed' as const }
              : tournament
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to finalize tournament'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [calculateEloPoints]
  );

  const getTournamentById = useCallback(
    (tournamentId: string) => {
      return tournaments.find(tournament => tournament.id === tournamentId);
    },
    [tournaments]
  );

  const getTournamentsByStatus = useCallback(
    (status: Tournament['status']) => {
      return tournaments.filter(tournament => tournament.status === status);
    },
    [tournaments]
  );

  const getMyTournaments = useCallback(() => {
    if (!user?.id) return [];
    return tournaments.filter(
      tournament => tournament.organizer_id === user.id
    );
  }, [tournaments, user?.id]);

  const searchTournaments = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return tournaments.filter(
        tournament =>
          tournament.name.toLowerCase().includes(lowercaseQuery) ||
          tournament.description?.toLowerCase().includes(lowercaseQuery) ||
          tournament.venue_address?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [tournaments]
  );

  const joinTournament = useMutation({
    mutationFn: async ({ tournamentId }: { tournamentId: string }) => {
      return await registerForTournament(tournamentId);
    },
    onSuccess: () => {
      toast.success('Successfully registered for tournament!');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: (error) => {
      toast.error('Failed to register for tournament');
      console.error('Tournament registration error:', error);
    },
  });

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    loading,
    error,
    joinTournament,
    fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    registerForTournament,
    cancelRegistration,
    getTournamentRegistrations,
    checkUserRegistration,
    createTournamentMatch,
    updateMatchResult,
    createTournamentResult,
    calculateEloPoints,
    getTournamentTiers,
    getTournamentResults,
    finalizeTournament,
    getTournamentById,
    getTournamentsByStatus,
    getMyTournaments,
    searchTournaments,
  };
};

export const useTournamentById = (id: string) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      if (!id) return null;

      // Mock tournament by id since tournaments table doesn't have all required fields
      const mockTournament = {
        id: id,
        name: 'Mock Tournament',
        description: 'Mock tournament description',
        tournament_type: 'single_elimination' as const,
        game_format: '8_ball' as const,
        max_participants: 32,
        current_participants: 12,
        registration_start: new Date().toISOString(),
        registration_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_end: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        club_id: 'club_1',
        venue_address: 'Mock Venue',
        entry_fee: 100,
        prize_pool: 1000000,
        first_prize: 500000,
        second_prize: 300000,
        third_prize: 200000,
        status: 'registration_open' as const,
        rules: 'Mock tournament rules',
        organizer_id: 'mock_user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clubs: {
          name: 'Mock Club',
          address: 'Mock Address',
          phone: '0123456789',
          email: 'mock@club.com'
        }
      };

      return mockTournament;
    },
    enabled: !!id,
  });
};