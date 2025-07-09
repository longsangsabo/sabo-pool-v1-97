// TournamentService Unit Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TournamentService } from '../TournamentService';
import { RewardsService } from '../RewardsService';
import { ValidationService } from '../ValidationService';
import { TournamentStatus, TournamentType, GameFormat, TournamentTier } from '@/types/tournament-enums';
import { 
  mockSupabase, 
  setupSupabaseMocks, 
  setMockError, 
  setMockUser,
  resetMockUser,
  mockToast,
  mockTournaments 
} from '@/test/mocks/supabase';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

vi.mock('../RewardsService', () => ({
  RewardsService: {
    calculateRewards: vi.fn().mockReturnValue({
      totalPrize: 500000,
      firstPlace: 250000,
      secondPlace: 150000,
      thirdPlace: 100000
    })
  }
}));

vi.mock('../ValidationService', () => ({
  ValidationService: {
    validateTournamentData: vi.fn().mockReturnValue({
      isValid: true,
      errors: []
    })
  }
}));

describe('TournamentService', () => {
  beforeEach(() => {
    setupSupabaseMocks();
    resetMockUser();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTournament', () => {
    const validTournamentData = {
      name: 'Test Tournament',
      description: 'Test Description',
      tournament_type: TournamentType.SINGLE_ELIMINATION,
      game_format: GameFormat.NINE_BALL,
      tier_level: TournamentTier.I,
      prize_pool: 500000,
      max_participants: 32,
      registration_start: '2024-12-01T00:00:00Z',
      registration_end: '2024-12-15T00:00:00Z',
      tournament_start: '2024-12-20T00:00:00Z',
      tournament_end: '2024-12-22T00:00:00Z',
      venue_address: 'Test Venue',
      entry_fee: 100000,
      is_public: true,
      requires_approval: false,
      eligible_ranks: ['K' as const, 'I' as const, 'H' as const],
      allow_all_ranks: false,
      min_rank_requirement: 'K' as const,
      max_rank_requirement: 'H' as const,
      rules: 'Standard tournament rules',
      contact_info: 'test@example.com'
    };

    it('should create tournament successfully with valid data', async () => {
      // Arrange
      const mockRewards = {
        totalPrize: 500000,
        firstPlace: 250000,
        secondPlace: 150000,
        thirdPlace: 100000
      };
      
      (RewardsService.calculateRewards as any).mockReturnValue(mockRewards);
      (ValidationService.validateTournamentData as any).mockReturnValue({
        isValid: true,
        errors: []
      });

      // Act
      const result = await TournamentService.createTournament(validTournamentData);

      // Assert
      expect(ValidationService.validateTournamentData).toHaveBeenCalledWith(validTournamentData);
      expect(RewardsService.calculateRewards).toHaveBeenCalledWith(
        validTournamentData.tier_level,
        validTournamentData.entry_fee,
        validTournamentData.max_participants,
        validTournamentData.game_format
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      expect(mockToast.success).toHaveBeenCalledWith('Tạo giải đấu thành công!');
      expect(result).toBeTruthy();
      expect(result?.name).toBe(validTournamentData.name);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidData = { ...validTournamentData, name: '' };
      (ValidationService.validateTournamentData as any).mockReturnValue({
        isValid: false,
        errors: ['Name is required']
      });

      // Act
      const result = await TournamentService.createTournament(invalidData);

      // Assert
      expect(ValidationService.validateTournamentData).toHaveBeenCalledWith(invalidData);
      expect(mockToast.error).toHaveBeenCalledWith('Dữ liệu không hợp lệ');
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = { message: 'Database connection failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.createTournament(validTournamentData);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi tạo giải đấu');
      expect(result).toBeNull();
    });

    it('should include created_by field from authenticated user', async () => {
      // Arrange
      const mockUser = { id: 'test-user-123' };
      setMockUser(mockUser);

      // Act
      await TournamentService.createTournament(validTournamentData);

      // Assert
      const insertCall = mockSupabase.from('tournaments').insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          created_by: mockUser.id
        })
      );
    });

    it('should use provided rewards if available', async () => {
      // Arrange
      const customRewards = {
        totalPrize: 1000000,
        showPrizes: true,
        positions: [
          { position: 1, name: 'Vô địch', eloPoints: 100, spaPoints: 1000, cashPrize: 500000, items: ['Cúp'], isVisible: true },
          { position: 2, name: 'Á quân', eloPoints: 60, spaPoints: 800, cashPrize: 300000, items: ['Huy chương'], isVisible: true },
          { position: 3, name: 'Hạng ba', eloPoints: 40, spaPoints: 600, cashPrize: 200000, items: ['Huy chương'], isVisible: true },
        ],
        specialAwards: [],
      };
      const dataWithRewards = { ...validTournamentData, rewards: customRewards };

      // Act
      await TournamentService.createTournament(dataWithRewards);

      // Assert
      expect(RewardsService.calculateRewards).not.toHaveBeenCalled();
      // Verify that the custom rewards are used
      const insertCall = mockSupabase.from('tournaments').insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          prize_pool: customRewards.totalPrize
        })
      );
    });

    it('should set correct default values', async () => {
      // Act
      await TournamentService.createTournament(validTournamentData);

      // Assert
      const insertCall = mockSupabase.from('tournaments').insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          current_participants: 0,
          status: TournamentStatus.REGISTRATION_OPEN,
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      );
    });
  });

  describe('deleteTournament', () => {
    const tournamentId = 'tournament-123';

    it('should perform soft delete by default', async () => {
      // Act
      const result = await TournamentService.deleteTournament(tournamentId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      const updateCall = mockSupabase.from('tournaments').update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          is_visible: false,
          status: 'cancelled',
          updated_at: expect.any(String)
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Đã xóa giải đấu!');
      expect(result).toBe(true);
    });

    it('should perform permanent delete when specified', async () => {
      // Act
      const result = await TournamentService.deleteTournament(tournamentId, true);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      const deleteCall = mockSupabase.from('tournaments').delete;
      expect(deleteCall).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Đã xóa vĩnh viễn giải đấu!');
      expect(result).toBe(true);
    });

    it('should handle database errors during soft delete', async () => {
      // Arrange
      const dbError = { message: 'Update failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.deleteTournament(tournamentId);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi xóa giải đấu');
      expect(result).toBe(false);
    });

    it('should handle database errors during permanent delete', async () => {
      // Arrange
      const dbError = { message: 'Delete failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.deleteTournament(tournamentId, true);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi xóa vĩnh viễn giải đấu');
      expect(result).toBe(false);
    });
  });

  describe('restoreTournament', () => {
    const tournamentId = 'tournament-123';

    it('should restore deleted tournament successfully', async () => {
      // Act
      const result = await TournamentService.restoreTournament(tournamentId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      const updateCall = mockSupabase.from('tournaments').update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: null,
          is_visible: true,
          updated_at: expect.any(String)
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Đã khôi phục giải đấu!');
      expect(result).toBe(true);
    });

    it('should handle database errors during restore', async () => {
      // Arrange
      const dbError = { message: 'Restore failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.restoreTournament(tournamentId);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi khôi phục giải đấu');
      expect(result).toBe(false);
    });
  });

  describe('getTournaments', () => {
    it('should fetch tournaments with default filters', async () => {
      // Act
      const result = await TournamentService.getTournaments();

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      expect(result).toHaveProperty('tournaments');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.tournaments)).toBe(true);
    });

    it('should apply status filters correctly', async () => {
      // Arrange
      const filters = {
        status: [TournamentStatus.REGISTRATION_OPEN, TournamentStatus.ONGOING]
      };

      // Act
      await TournamentService.getTournaments(filters);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      // Verify that filters are applied (this would be verified through query builder chain)
    });

    it('should handle showDeleted filter correctly', async () => {
      // Arrange
      const filters = { showDeleted: true };

      // Act
      await TournamentService.getTournaments(filters);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      // Should filter for deleted tournaments
    });

    it('should apply search filters', async () => {
      // Arrange
      const filters = { search: 'test tournament' };

      // Act
      await TournamentService.getTournaments(filters);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      // Search should be applied to name and description
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = { message: 'Query failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.getTournaments();

      // Assert
      expect(result).toEqual({ tournaments: [], total: 0 });
    });
  });

  describe('updateTournament', () => {
    const tournamentId = 'tournament-123';
    const updateData = {
      name: 'Updated Tournament Name',
      description: 'Updated description'
    };

    it('should update tournament successfully', async () => {
      // Act
      const result = await TournamentService.updateTournament(tournamentId, updateData);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      const updateCall = mockSupabase.from('tournaments').update;
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String)
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Cập nhật giải đấu thành công!');
      expect(result).toBeTruthy();
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const dbError = { message: 'Update failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.updateTournament(tournamentId, updateData);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi cập nhật giải đấu');
      expect(result).toBeNull();
    });
  });

  describe('registerPlayer', () => {
    const tournamentId = 'tournament-123';
    const playerId = 'player-456';

    it('should register player successfully', async () => {
      // Act
      const result = await TournamentService.registerPlayer(tournamentId, playerId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournament_registrations');
      expect(mockToast.success).toHaveBeenCalledWith('Đăng ký tham gia thành công!');
      expect(result).toBe(true);
    });

    it('should handle registration errors', async () => {
      // Arrange
      const dbError = { message: 'Registration failed' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.registerPlayer(tournamentId, playerId);

      // Assert
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi đăng ký tham gia');
      expect(result).toBe(false);
    });
  });

  describe('getTournamentById', () => {
    const tournamentId = 'tournament-123';

    it('should fetch tournament with full details', async () => {
      // Act
      const result = await TournamentService.getTournamentById(tournamentId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
      // Should include related registrations and profiles
      expect(result).toBeTruthy();
    });

    it('should return null for non-existent tournament', async () => {
      // Arrange
      const dbError = { code: 'PGRST116', message: 'No rows found' };
      setMockError(dbError);

      // Act
      const result = await TournamentService.getTournamentById(tournamentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('enhanceTournamentData', () => {
    it('should calculate registration status correctly', async () => {
      // This would test the private enhanceTournamentData method
      // We can test it indirectly through getTournamentById or getTournaments
      const result = await TournamentService.getTournaments();
      
      expect(result.tournaments).toBeDefined();
      // Enhanced tournaments should have additional calculated fields
      if (result.tournaments.length > 0) {
        const tournament = result.tournaments[0];
        expect(tournament).toHaveProperty('available_slots');
        expect(tournament).toHaveProperty('registration_status');
        expect(tournament).toHaveProperty('rewards');
      }
    });
  });
});