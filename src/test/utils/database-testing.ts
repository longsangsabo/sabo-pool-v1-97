import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export class DatabaseTester {
  /**
   * Setup clean test database state
   */
  static async setupTestData() {
    console.log('🗄️ Setting up test database data...');
    
    try {
      // Create demo users for testing
      await this.createDemoUsers();
      
      // Create test tournaments
      await this.createTestTournaments();
      
      // Create test matches
      await this.createTestMatches();
      
      console.log('✅ Test database data setup completed');
    } catch (error) {
      console.error('❌ Failed to setup test database data:', error);
      throw error;
    }
  }

  /**
   * Cleanup test data
   */
  static async cleanupTestData() {
    console.log('🧹 Cleaning up test database data...');
    
    try {
      // Clean up in reverse order to handle foreign key constraints
      await this.cleanupMatches();
      await this.cleanupTournaments();
      await this.cleanupUsers();
      
      console.log('✅ Test database data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test database data:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Create demo users for testing
   */
  private static async createDemoUsers() {
    const testUsers = [
      {
        id: 'test-user-1',
        user_id: 'test-user-1',
        full_name: 'Test User One',
        display_name: 'TestUser1',
        phone: '0901000001',
        email: 'test1@example.com',
        skill_level: 'intermediate',
        is_demo_user: true
      },
      {
        id: 'test-user-2',
        user_id: 'test-user-2',
        full_name: 'Test User Two',
        display_name: 'TestUser2',
        phone: '0901000002',
        email: 'test2@example.com',
        skill_level: 'advanced',
        is_demo_user: true
      },
      {
        id: 'test-admin',
        user_id: 'test-admin',
        full_name: 'Test Admin',
        display_name: 'TestAdmin',
        phone: '0901000000',
        email: 'admin@example.com',
        skill_level: 'expert',
        is_demo_user: true,
        is_admin: true
      }
    ];

    for (const user of testUsers) {
      await supabase.from('profiles').upsert(user, { onConflict: 'id' });
    }
  }

  /**
   * Create test tournaments
   */
  private static async createTestTournaments() {
    const testTournaments = [
      {
        id: 'test-tournament-1',
        name: 'Test Tournament 1',
        description: 'E2E Test Tournament',
        tournament_type: 'single_elimination',
        status: 'upcoming',
        max_participants: 16,
        current_participants: 0,
        created_by: 'test-admin',
        registration_start: new Date().toISOString(),
        registration_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'test-tournament-2',
        name: 'Test Tournament 2',
        description: 'Another E2E Test Tournament',
        tournament_type: 'double_elimination',
        status: 'registration_open',
        max_participants: 8,
        current_participants: 2,
        created_by: 'test-admin',
        registration_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        registration_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tournament_end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const tournament of testTournaments) {
      await supabase.from('tournaments').upsert(tournament, { onConflict: 'id' });
    }
  }

  /**
   * Create test matches
   */
  private static async createTestMatches() {
    const testMatches = [
      {
        id: 'test-match-1',
        player1_id: 'test-user-1',
        player2_id: 'test-user-2',
        status: 'completed',
        winner_id: 'test-user-1',
        score_player1: 5,
        score_player2: 3,
        played_at: new Date().toISOString()
      }
    ];

    for (const match of testMatches) {
      await supabase.from('matches').upsert(match, { onConflict: 'id' });
    }
  }

  /**
   * Cleanup methods
   */
  private static async cleanupMatches() {
    await supabase.from('matches').delete().like('id', 'test-match-%');
    await supabase.from('match_results').delete().like('id', 'test-match-result-%');
  }

  private static async cleanupTournaments() {
    await supabase.from('tournament_registrations').delete().like('tournament_id', 'test-tournament-%');
    await supabase.from('tournaments').delete().like('id', 'test-tournament-%');
  }

  private static async cleanupUsers() {
    await supabase.from('profiles').delete().like('id', 'test-user-%');
    await supabase.from('profiles').delete().eq('id', 'test-admin');
  }

  /**
   * Verify database state for specific test scenarios
   */
  static async verifyDatabaseState(scenario: string): Promise<boolean> {
    switch (scenario) {
      case 'clean_state':
        return await this.verifyCleanState();
      case 'tournament_creation':
        return await this.verifyTournamentCreation();
      case 'user_registration':
        return await this.verifyUserRegistration();
      default:
        return true;
    }
  }

  private static async verifyCleanState(): Promise<boolean> {
    const { data: testData } = await supabase
      .from('tournaments')
      .select('id')
      .like('id', 'test-%');
    
    return !testData || testData.length === 0;
  }

  private static async verifyTournamentCreation(): Promise<boolean> {
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id')
      .like('name', '%E2E Test%');
    
    return tournaments && tournaments.length > 0;
  }

  private static async verifyUserRegistration(): Promise<boolean> {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_demo_user', true);
    
    return users && users.length >= 2;
  }

  /**
   * Create specific test data for different test scenarios
   */
  static async createScenarioData(scenario: string) {
    switch (scenario) {
      case 'tournament_full':
        await this.createFullTournament();
        break;
      case 'tournament_registration_closed':
        await this.createClosedRegistrationTournament();
        break;
      case 'ongoing_tournament':
        await this.createOngoingTournament();
        break;
      default:
        break;
    }
  }

  private static async createFullTournament() {
    // Create a tournament that's at max capacity
    const tournament = {
      id: 'test-tournament-full',
      name: 'Full Test Tournament',
      description: 'Tournament at max capacity',
      tournament_type: 'single_elimination',
      status: 'registration_open',
      max_participants: 2,
      current_participants: 2,
      created_by: 'test-admin'
    };

    await supabase.from('tournaments').upsert(tournament, { onConflict: 'id' });

    // Add registrations
    const registrations = [
      {
        tournament_id: 'test-tournament-full',
        player_id: 'test-user-1',
        status: 'confirmed'
      },
      {
        tournament_id: 'test-tournament-full',
        player_id: 'test-user-2',
        status: 'confirmed'
      }
    ];

    for (const registration of registrations) {
      await supabase.from('tournament_registrations').upsert(registration);
    }
  }

  private static async createClosedRegistrationTournament() {
    const tournament = {
      id: 'test-tournament-closed',
      name: 'Closed Registration Tournament',
      description: 'Tournament with closed registration',
      tournament_type: 'single_elimination',
      status: 'registration_closed',
      max_participants: 16,
      current_participants: 8,
      created_by: 'test-admin',
      registration_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    };

    await supabase.from('tournaments').upsert(tournament, { onConflict: 'id' });
  }

  private static async createOngoingTournament() {
    const tournament = {
      id: 'test-tournament-ongoing',
      name: 'Ongoing Tournament',
      description: 'Tournament currently in progress',
      tournament_type: 'single_elimination',
      status: 'ongoing',
      max_participants: 4,
      current_participants: 4,
      created_by: 'test-admin',
      tournament_start: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    };

    await supabase.from('tournaments').upsert(tournament, { onConflict: 'id' });
  }

  /**
   * Simulate real-time database changes for testing real-time features
   */
  static async simulateRealTimeChanges(scenario: string) {
    switch (scenario) {
      case 'tournament_registration':
        await this.simulateTournamentRegistration();
        break;
      case 'match_result_update':
        await this.simulateMatchResultUpdate();
        break;
      case 'ranking_change':
        await this.simulateRankingChange();
        break;
    }
  }

  private static async simulateTournamentRegistration() {
    // Simulate a new user registering for a tournament
    const registration = {
      tournament_id: 'test-tournament-1',
      player_id: 'test-user-1',
      status: 'confirmed',
      registration_date: new Date().toISOString()
    };

    await supabase.from('tournament_registrations').insert(registration);

    // Update tournament participant count
    await supabase
      .from('tournaments')
      .update({ current_participants: 1 })
      .eq('id', 'test-tournament-1');
  }

  private static async simulateMatchResultUpdate() {
    // Simulate updating a match result
    const matchResult = {
      id: 'test-match-result-1',
      player1_id: 'test-user-1',
      player2_id: 'test-user-2',
      player1_score: 5,
      player2_score: 3,
      winner_id: 'test-user-1',
      result_status: 'verified',
      match_date: new Date().toISOString()
    };

    await supabase.from('match_results').upsert(matchResult, { onConflict: 'id' });
  }

  private static async simulateRankingChange() {
    // Simulate a ranking update
    const ranking = {
      player_id: 'test-user-1',
      elo_points: 1250,
      spa_points: 150,
      total_matches: 10,
      wins: 7,
      losses: 3
    };

    await supabase.from('player_rankings').upsert(ranking, { onConflict: 'player_id' });
  }
}