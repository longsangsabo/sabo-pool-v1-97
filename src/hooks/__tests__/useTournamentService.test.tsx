// useTournamentService Hook Tests
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTournamentService } from '../useTournamentService';
import { useAuth } from '../useAuth';
import { TournamentRepository } from '@/repositories/tournamentRepository';
import { RankingService } from '@/services/rankingService';
import { 
  mockSupabase, 
  setupSupabaseMocks, 
  mockToast,
  mockTournaments,
  mockUsers 
} from '@/test/mocks/supabase';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

vi.mock('../useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/repositories/tournamentRepository', () => ({
  TournamentRepository: {
    getTournaments: vi.fn(),
    createTournament: vi.fn(),
    registerPlayer: vi.fn(),
    cancelRegistration: vi.fn(),
    generateBracket: vi.fn(),
    updateTournamentResults: vi.fn(),
    checkUserRegistration: vi.fn(),
    autoUpdateTournamentStatus: vi.fn(),
  }
}));

vi.mock('@/services/rankingService', () => ({
  RankingService: {
    calculateTournamentRewards: vi.fn(),
    getTournamentPositions: vi.fn(),
    formatPosition: vi.fn(),
  }
}));

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTournamentService', () => {
  beforeEach(() => {
    setupSupabaseMocks();
    vi.clearAllMocks();
    
    // Default mock for useAuth
    (useAuth as any).mockReturnValue({
      user: mockUsers[0]
    });

    // Default mocks for repository
    (TournamentRepository.getTournaments as any).mockResolvedValue(mockTournaments);
    (TournamentRepository.createTournament as any).mockResolvedValue(mockTournaments[0]);
    (TournamentRepository.registerPlayer as any).mockResolvedValue({ id: 'reg-1' });
    (TournamentRepository.cancelRegistration as any).mockResolvedValue(true);
    (TournamentRepository.generateBracket as any).mockResolvedValue({ success: true });
    (TournamentRepository.updateTournamentResults as any).mockResolvedValue([]);
    (TournamentRepository.checkUserRegistration as any).mockResolvedValue(null);
    (TournamentRepository.autoUpdateTournamentStatus as any).mockResolvedValue(null);

    // Default mocks for ranking service
    (RankingService.calculateTournamentRewards as any).mockReturnValue({
      eloPoints: 50,
      spaPoints: 100
    });
    (RankingService.getTournamentPositions as any).mockReturnValue(['CHAMPION', 'RUNNER_UP']);
    (RankingService.formatPosition as any).mockReturnValue('1st Place');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with loading state', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.tournaments).toEqual([]);
    });

    it('should load tournaments on mount', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(TournamentRepository.getTournaments).toHaveBeenCalled();
      expect(result.current.tournaments).toEqual(mockTournaments);
    });
  });

  describe('createTournament', () => {
    it('should create tournament and invalidate queries', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentData = {
        name: 'New Tournament',
        description: 'Test tournament',
        tournament_type: 'single_elimination'
      };

      await act(async () => {
        await result.current.createTournament(tournamentData);
      });

      expect(TournamentRepository.createTournament).toHaveBeenCalledWith({
        ...tournamentData,
        created_by: mockUsers[0].id,
        status: 'upcoming',
        current_participants: 0
      });
      expect(mockToast.success).toHaveBeenCalledWith('Giải đấu đã được tạo thành công!');
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      (TournamentRepository.createTournament as any).mockRejectedValue(error);

      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentData = { name: 'New Tournament' };

      await act(async () => {
        try {
          await result.current.createTournament(tournamentData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi tạo giải đấu');
    });

    it('should require authenticated user', async () => {
      (useAuth as any).mockReturnValue({ user: null });

      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentData = { name: 'New Tournament' };

      await act(async () => {
        try {
          await result.current.createTournament(tournamentData);
        } catch (error) {
          expect(error.message).toBe('Must be logged in');
        }
      });
    });
  });

  describe('registerForTournament', () => {
    it('should register user for tournament', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentId = 'tournament-1';

      await act(async () => {
        await result.current.registerForTournament(tournamentId);
      });

      expect(TournamentRepository.registerPlayer).toHaveBeenCalledWith({
        tournament_id: tournamentId,
        player_id: mockUsers[0].id,
        registration_status: 'pending',
        payment_status: 'unpaid',
        status: 'pending'
      });
      expect(mockToast.success).toHaveBeenCalledWith('Đăng ký giải đấu thành công!');
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      (TournamentRepository.registerPlayer as any).mockRejectedValue(error);

      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.registerForTournament('tournament-1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi khi đăng ký giải đấu');
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel tournament registration', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentId = 'tournament-1';

      await act(async () => {
        await result.current.cancelRegistration(tournamentId);
      });

      expect(TournamentRepository.cancelRegistration).toHaveBeenCalledWith(
        tournamentId,
        mockUsers[0].id
      );
      expect(mockToast.success).toHaveBeenCalledWith('Đã hủy đăng ký giải đấu');
    });
  });

  describe('generateBracket', () => {
    it('should generate tournament bracket', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentId = 'tournament-1';
      const seedingMethod = 'elo_ranking';

      await act(async () => {
        await result.current.generateBracket({ tournamentId, seedingMethod });
      });

      expect(TournamentRepository.generateBracket).toHaveBeenCalledWith(
        tournamentId,
        seedingMethod
      );
      expect(mockToast.success).toHaveBeenCalledWith('Bracket đã được tạo thành công!');
    });
  });

  describe('finalizeTournament', () => {
    it('should finalize tournament with calculated rewards', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentId = 'tournament-1';
      const results = [
        {
          player_id: 'player-1',
          final_position: 1,
          player_rank: 'Gold' as const,
          matches_played: 5,
          matches_won: 5,
          matches_lost: 0
        }
      ];

      await act(async () => {
        await result.current.finalizeTournament({ tournamentId, results });
      });

      expect(RankingService.calculateTournamentRewards).toHaveBeenCalled();
      expect(TournamentRepository.updateTournamentResults).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Kết quả giải đấu đã được cập nhật!');
    });
  });

  describe('Utility Functions', () => {
    it('should calculate tournament rewards', () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const rewards = result.current.calculateTournamentRewards('CHAMPION', 'Gold');

      expect(RankingService.calculateTournamentRewards).toHaveBeenCalledWith('CHAMPION', 'Gold');
      expect(rewards).toEqual({ eloPoints: 50, spaPoints: 100 });
    });

    it('should get all tournament rewards for display', () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const allRewards = result.current.getAllTournamentRewards('Gold');

      expect(RankingService.getTournamentPositions).toHaveBeenCalled();
      expect(Array.isArray(allRewards)).toBe(true);
    });

    it('should check user registration status', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      const tournamentId = 'tournament-1';

      await act(async () => {
        const registration = await result.current.checkUserRegistration(tournamentId);
        expect(registration).toBeNull();
      });

      expect(TournamentRepository.checkUserRegistration).toHaveBeenCalledWith(
        tournamentId,
        mockUsers[0].id
      );
    });

    it('should auto-update tournament status', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.autoUpdateTournamentStatus();
      });

      expect(TournamentRepository.autoUpdateTournamentStatus).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should track creation loading state', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCreating).toBe(false);

      const createPromise = act(async () => {
        result.current.createTournament({ name: 'Test' });
      });

      // During the async operation, isCreating should be true
      expect(result.current.isCreating).toBe(true);

      await createPromise;

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should track registration loading state', async () => {
      const { result } = renderHook(() => useTournamentService(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isRegistering).toBe(false);

      const registerPromise = act(async () => {
        result.current.registerForTournament('tournament-1');
      });

      expect(result.current.isRegistering).toBe(true);

      await registerPromise;

      await waitFor(() => {
        expect(result.current.isRegistering).toBe(false);
      });
    });
  });
});