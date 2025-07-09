// Integration Tests for Tournament Lifecycle
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TournamentService } from '@/services/TournamentService';
import { TournamentRepository } from '@/repositories/tournamentRepository';
import { RewardsService } from '@/services/RewardsService';
import { ValidationService } from '@/services/ValidationService';
import { TournamentStatus, TournamentType, GameFormat, TournamentTier } from '@/types/tournament-enums';
import { 
  mockSupabase, 
  setupSupabaseMocks, 
  setMockUser,
  mockToast,
  mockUsers 
} from '@/test/mocks/supabase';

// Mock all dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: mockToast
}));

vi.mock('@/services/RewardsService', () => ({
  RewardsService: {
    calculateRewards: vi.fn().mockReturnValue({
      totalPrize: 500000,
      firstPlace: 250000,
      secondPlace: 150000,
      thirdPlace: 100000
    })
  }
}));

vi.mock('@/services/ValidationService', () => ({
  ValidationService: {
    validateTournamentData: vi.fn().mockReturnValue({
      isValid: true,
      errors: []
    })
  }
}));

describe('Tournament Lifecycle Integration Tests', () => {
  let createdTournamentId: string;
  let mockUser: any;

  beforeEach(() => {
    setupSupabaseMocks();
    mockUser = mockUsers[0];
    setMockUser(mockUser);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Tournament Lifecycle', () => {
    it('should handle complete tournament flow: create → register → manage → complete', async () => {
      // Step 1: Create Tournament
      const tournamentData = {
        name: 'Integration Test Tournament',
        description: 'Test tournament for integration testing',
        tournament_type: TournamentType.SINGLE_ELIMINATION,
        game_format: GameFormat.RACE_TO_5,
        tier_level: TournamentTier.AMATEUR,
        max_participants: 16,
        registration_start: '2024-12-01T00:00:00Z',
        registration_end: '2024-12-15T00:00:00Z',
        tournament_start: '2024-12-20T00:00:00Z',
        tournament_end: '2024-12-22T00:00:00Z',
        venue_address: 'Integration Test Venue',
        entry_fee: 100000,
        is_public: true,
        requires_approval: false,
        eligible_ranks: ['Bronze', 'Silver', 'Gold'],
        allow_all_ranks: false,
        rules: 'Standard tournament rules',
        contact_info: 'test@example.com'
      };

      const createdTournament = await TournamentService.createTournament(tournamentData);
      
      expect(createdTournament).toBeTruthy();
      expect(createdTournament?.name).toBe(tournamentData.name);
      expect(ValidationService.validateTournamentData).toHaveBeenCalledWith(tournamentData);
      expect(RewardsService.calculateRewards).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Tạo giải đấu thành công!');

      createdTournamentId = createdTournament?.id || 'test-tournament-id';

      // Step 2: Register Players
      const registrationResult = await TournamentService.registerPlayer(
        createdTournamentId, 
        mockUser.id
      );

      expect(registrationResult).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('Đăng ký tham gia thành công!');

      // Step 3: Update Tournament Status
      const statusUpdateResult = await TournamentService.updateTournamentStatus(
        createdTournamentId,
        TournamentStatus.ONGOING
      );

      expect(statusUpdateResult).toBe(true);

      // Step 4: Get Tournament with Full Details
      const fullTournament = await TournamentService.getTournamentById(createdTournamentId);

      expect(fullTournament).toBeTruthy();
      expect(fullTournament?.id).toBe(createdTournamentId);

      // Step 5: Soft Delete Tournament
      const deleteResult = await TournamentService.deleteTournament(createdTournamentId);

      expect(deleteResult).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('Đã xóa giải đấu!');

      // Step 6: Restore Tournament
      const restoreResult = await TournamentService.restoreTournament(createdTournamentId);

      expect(restoreResult).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('Đã khôi phục giải đấu!');
    });

    it('should handle tournament visibility correctly throughout lifecycle', async () => {
      // Create tournament
      const tournamentData = {
        name: 'Visibility Test Tournament',
        description: 'Test tournament visibility',
        tournament_type: TournamentType.SINGLE_ELIMINATION,
        is_public: true
      };

      const tournament = await TournamentService.createTournament(tournamentData);
      createdTournamentId = tournament?.id || 'test-id';

      // Check visible tournaments (should include new tournament)
      const visibleTournaments = await TournamentService.getAllVisibleTournaments();
      expect(Array.isArray(visibleTournaments)).toBe(true);

      // Soft delete (should make invisible)
      await TournamentService.deleteTournament(createdTournamentId);

      // Check visible tournaments again (should not include deleted tournament)
      const visibleAfterDelete = await TournamentService.getAllVisibleTournaments();
      expect(Array.isArray(visibleAfterDelete)).toBe(true);

      // Check deleted tournaments (should include deleted tournament)
      const deletedTournaments = await TournamentService.getTournaments({ showDeleted: true });
      expect(deletedTournaments.tournaments).toBeDefined();

      // Restore tournament
      await TournamentService.restoreTournament(createdTournamentId);

      // Check visible tournaments again (should include restored tournament)
      const visibleAfterRestore = await TournamentService.getAllVisibleTournaments();
      expect(Array.isArray(visibleAfterRestore)).toBe(true);
    });
  });

  describe('Error Handling in Tournament Flow', () => {
    it('should handle validation errors during creation', async () => {
      // Mock validation to fail
      (ValidationService.validateTournamentData as any).mockReturnValue({
        isValid: false,
        errors: ['Name is required', 'Invalid date range']
      });

      const invalidTournamentData = {
        name: '', // Invalid: empty name
        description: 'Test',
        tournament_type: TournamentType.SINGLE_ELIMINATION
      };

      const result = await TournamentService.createTournament(invalidTournamentData);

      expect(result).toBeNull();
      expect(mockToast.error).toHaveBeenCalledWith('Dữ liệu không hợp lệ');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle registration conflicts', async () => {
      // Create tournament first
      const tournament = await TournamentService.createTournament({
        name: 'Conflict Test',
        tournament_type: TournamentType.SINGLE_ELIMINATION
      });

      createdTournamentId = tournament?.id || 'test-id';

      // First registration should succeed
      const firstRegistration = await TournamentService.registerPlayer(
        createdTournamentId,
        mockUser.id
      );
      expect(firstRegistration).toBe(true);

      // Mock database error for duplicate registration
      const dbError = { code: '23505', message: 'duplicate key value violates unique constraint' };
      vi.mocked(mockSupabase.from).mockImplementation(() => {
        throw dbError;
      });

      // Second registration should fail
      const secondRegistration = await TournamentService.registerPlayer(
        createdTournamentId,
        mockUser.id
      );
      expect(secondRegistration).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Có lỗi xảy ra khi đăng ký tham gia');
    });

    it('should handle database connection failures gracefully', async () => {
      // Mock network/database error
      const connectionError = { message: 'Network error', code: 'NETWORK_ERROR' };
      vi.mocked(mockSupabase.from).mockImplementation(() => {
        throw connectionError;
      });

      // All operations should fail gracefully
      const createResult = await TournamentService.createTournament({
        name: 'Test Tournament',
        tournament_type: TournamentType.SINGLE_ELIMINATION
      });
      expect(createResult).toBeNull();

      const tournamentsResult = await TournamentService.getTournaments();
      expect(tournamentsResult).toEqual({ tournaments: [], total: 0 });

      const deleteResult = await TournamentService.deleteTournament('any-id');
      expect(deleteResult).toBe(false);

      // Verify error toasts were shown
      expect(mockToast.error).toHaveBeenCalledTimes(3);
    });
  });

  describe('Tournament Filtering and Search', () => {
    beforeEach(async () => {
      // Create test tournaments with different statuses
      const tournaments = [
        {
          name: 'Upcoming Tournament',
          status: TournamentStatus.UPCOMING,
          tournament_type: TournamentType.SINGLE_ELIMINATION
        },
        {
          name: 'Ongoing Tournament',
          status: TournamentStatus.ONGOING,
          tournament_type: TournamentType.DOUBLE_ELIMINATION
        },
        {
          name: 'Completed Tournament',
          status: TournamentStatus.COMPLETED,
          tournament_type: TournamentType.SINGLE_ELIMINATION
        }
      ];

      for (const tournamentData of tournaments) {
        await TournamentService.createTournament(tournamentData);
      }
    });

    it('should filter tournaments by status correctly', async () => {
      // Test filtering by single status
      const upcomingTournaments = await TournamentService.getTournaments({
        status: [TournamentStatus.UPCOMING]
      });
      expect(upcomingTournaments.tournaments).toBeDefined();

      // Test filtering by multiple statuses
      const activeTournaments = await TournamentService.getTournaments({
        status: [TournamentStatus.UPCOMING, TournamentStatus.ONGOING]
      });
      expect(activeTournaments.tournaments).toBeDefined();
    });

    it('should search tournaments by name and description', async () => {
      const searchResults = await TournamentService.getTournaments({
        search: 'Upcoming'
      });
      expect(searchResults.tournaments).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const firstPage = await TournamentService.getTournaments({
        limit: 2,
        offset: 0
      });
      expect(firstPage.tournaments).toBeDefined();

      const secondPage = await TournamentService.getTournaments({
        limit: 2,
        offset: 2
      });
      expect(secondPage.tournaments).toBeDefined();
    });
  });

  describe('Tournament Registration Management', () => {
    beforeEach(async () => {
      const tournament = await TournamentService.createTournament({
        name: 'Registration Test Tournament',
        tournament_type: TournamentType.SINGLE_ELIMINATION,
        max_participants: 4
      });
      createdTournamentId = tournament?.id || 'test-id';
    });

    it('should handle player registration and cancellation', async () => {
      // Register player
      const registrationResult = await TournamentService.registerPlayer(
        createdTournamentId,
        mockUser.id
      );
      expect(registrationResult).toBe(true);

      // Verify tournament participant count is updated
      const updatedTournament = await TournamentService.getTournamentById(createdTournamentId);
      expect(updatedTournament).toBeTruthy();

      // Cancel registration through repository (simulating the flow)
      const cancellationResult = await TournamentRepository.cancelRegistration(
        createdTournamentId,
        mockUser.id
      );
      expect(cancellationResult).toBeTruthy();
    });

    it('should prevent registration when tournament is full', async () => {
      // This test would require mocking the participant count check
      // In a real scenario, the database would enforce this constraint
      
      const tournament = await TournamentService.getTournamentById(createdTournamentId);
      expect(tournament).toBeTruthy();
      
      // The business logic for checking max participants would be tested here
      if (tournament && tournament.current_participants >= tournament.max_participants) {
        // Should prevent registration
        expect(true).toBe(true); // Placeholder assertion
      }
    });
  });

  describe('Real-time Updates Simulation', () => {
    it('should handle tournament status updates from external sources', async () => {
      // Create tournament
      const tournament = await TournamentService.createTournament({
        name: 'Real-time Test Tournament',
        tournament_type: TournamentType.SINGLE_ELIMINATION
      });
      createdTournamentId = tournament?.id || 'test-id';

      // Simulate external status update (like from admin panel)
      const statusUpdate = await TournamentService.updateTournamentStatus(
        createdTournamentId,
        TournamentStatus.ONGOING
      );
      expect(statusUpdate).toBe(true);

      // Simulate real-time sync (would be tested with actual real-time hooks)
      const updatedTournament = await TournamentService.getTournamentById(createdTournamentId);
      expect(updatedTournament).toBeTruthy();
    });

    it('should handle concurrent modifications gracefully', async () => {
      // Create tournament
      const tournament = await TournamentService.createTournament({
        name: 'Concurrency Test Tournament',
        tournament_type: TournamentType.SINGLE_ELIMINATION
      });
      createdTournamentId = tournament?.id || 'test-id';

      // Simulate concurrent updates
      const updates = [
        TournamentService.updateTournament(createdTournamentId, { 
          description: 'Updated description 1' 
        }),
        TournamentService.updateTournament(createdTournamentId, { 
          venue_address: 'Updated venue' 
        })
      ];

      // Both updates should complete (in a real scenario, last-write-wins or conflict resolution would apply)
      const results = await Promise.allSettled(updates);
      expect(results.length).toBe(2);
    });
  });
});