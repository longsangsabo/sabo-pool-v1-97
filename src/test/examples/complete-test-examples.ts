// Complete Test Examples for Tournament Management System
// Showcasing best practices and patterns

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { test as playwrightTest, expect as playwrightExpect } from '@playwright/test';
import { 
  createMockTournament, 
  createMockUser, 
  createTournamentWithParticipants 
} from '../factories';
import { supabase } from '@/integrations/supabase/client';

// ====================
// 1. UNIT TEST EXAMPLES
// ====================

describe('TournamentService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
      }))
    };
    vi.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create tournament with valid data', async () => {
      // Arrange
      const tournamentData = createMockTournament({
        name: 'Test Championship',
        maxParticipants: 16,
        entryFee: 100000
      });

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: tournamentData,
        error: null
      });

      const service = new TournamentService(mockSupabase);

      // Act
      const result = await service.createTournament(tournamentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Test Championship',
        maxParticipants: 16,
        entryFee: 100000,
        id: expect.any(String)
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidData = createMockTournament({
        name: '', // Invalid empty name
        maxParticipants: -1 // Invalid negative number
      });

      const service = new TournamentService(mockSupabase);

      // Act & Assert
      await expect(service.createTournament(invalidData))
        .rejects
        .toThrow('Tournament name is required');
    });

    it('should handle database errors', async () => {
      // Arrange
      const tournamentData = createMockTournament();
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const service = new TournamentService(mockSupabase);

      // Act
      const result = await service.createTournament(tournamentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('getTournamentsByStatus', () => {
    it('should filter tournaments by status', async () => {
      // Arrange
      const activeTournaments = [
        createMockTournament({ status: 'active' }),
        createMockTournament({ status: 'active' })
      ];

      mockSupabase.from().select().eq().mockResolvedValue({
        data: activeTournaments,
        error: null
      });

      const service = new TournamentService(mockSupabase);

      // Act
      const result = await service.getTournamentsByStatus('active');

      // Assert
      expect(result.data).toHaveLength(2);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('status', 'active');
      result.data.forEach(tournament => {
        expect(tournament.status).toBe('active');
      });
    });
  });
});

// ====================
// 2. COMPONENT TEST EXAMPLES
// ====================

describe('TournamentCard Component', () => {
  it('should display tournament information correctly', () => {
    // Arrange
    const tournament = createMockTournament({
      name: 'Summer Championship',
      entryFee: 150000,
      maxParticipants: 32,
      currentParticipants: 12,
      status: 'upcoming'
    });

    // Act
    render(<TournamentCard tournament={tournament} />);

    // Assert
    expect(screen.getByText('Summer Championship')).toBeInTheDocument();
    expect(screen.getByText('150,000 VND')).toBeInTheDocument();
    expect(screen.getByText('12/32 players')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
  });

  it('should disable join button when tournament is full', () => {
    // Arrange
    const fullTournament = createMockTournament({
      maxParticipants: 16,
      currentParticipants: 16
    });

    // Act
    render(<TournamentCard tournament={fullTournament} />);

    // Assert
    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeDisabled();
    expect(screen.getByText('Tournament Full')).toBeInTheDocument();
  });

  it('should handle join tournament action', async () => {
    // Arrange
    const tournament = createMockTournament();
    const mockOnJoin = vi.fn().mockResolvedValue({ success: true });

    render(<TournamentCard tournament={tournament} onJoin={mockOnJoin} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /join/i }));

    // Assert
    expect(mockOnJoin).toHaveBeenCalledWith(tournament.id);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Successfully joined!')).toBeInTheDocument();
    });
  });

  it('should handle join tournament error', async () => {
    // Arrange
    const tournament = createMockTournament();
    const mockOnJoin = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<TournamentCard tournament={tournament} onJoin={mockOnJoin} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /join/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to join tournament')).toBeInTheDocument();
    });
  });
});

// ====================
// 3. INTEGRATION TEST EXAMPLES
// ====================

describe('Tournament API Integration', () => {
  beforeEach(async () => {
    // Setup test database
    await cleanupTestDatabase();
    await seedBaseData();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve tournament with participants', async () => {
    // Arrange
    const user = createMockUser();
    const tournamentData = createMockTournament({
      createdBy: user.id,
      maxParticipants: 8
    });

    // Act - Create user
    const { data: createdUser } = await supabase
      .from('profiles')
      .insert(user)
      .select()
      .single();

    // Act - Create tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    // Act - Join tournament
    await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournament.id,
        user_id: createdUser.id
      });

    // Assert - Verify data consistency
    const { data: tournamentWithParticipants } = await supabase
      .from('tournaments')
      .select(`
        *,
        registrations:tournament_registrations(
          user:profiles(*)
        )
      `)
      .eq('id', tournament.id)
      .single();

    expect(tournamentWithParticipants.name).toBe(tournamentData.name);
    expect(tournamentWithParticipants.registrations).toHaveLength(1);
    expect(tournamentWithParticipants.registrations[0].user.id).toBe(createdUser.id);
  });

  it('should handle tournament capacity limits', async () => {
    // Arrange
    const { tournament, participants } = createTournamentWithParticipants(2);
    
    // Create tournament with max 2 participants
    const { data: createdTournament } = await supabase
      .from('tournaments')
      .insert({ ...tournament, maxParticipants: 2 })
      .select()
      .single();

    // Add participants to database
    for (const participant of participants) {
      await supabase.from('profiles').insert(participant);
      await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: createdTournament.id,
          user_id: participant.id
        });
    }

    // Try to add third participant
    const extraUser = createMockUser();
    await supabase.from('profiles').insert(extraUser);

    // Act & Assert
    const { error } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: createdTournament.id,
        user_id: extraUser.id
      });

    expect(error).toBeTruthy();
    expect(error.message).toContain('Tournament is full');
  });
});

// ====================
// 4. E2E TEST EXAMPLES
// ====================

// Page Object Model
class TournamentPage {
  constructor(private page: any) {}

  async navigate() {
    await this.page.goto('/tournaments');
    await this.page.waitForLoadState('networkidle');
  }

  async createTournament(data: any) {
    await this.page.click('[data-testid="create-tournament-btn"]');
    await this.page.fill('[data-testid="tournament-name"]', data.name);
    await this.page.fill('[data-testid="entry-fee"]', data.entryFee.toString());
    await this.page.selectOption('[data-testid="max-participants"]', data.maxParticipants.toString());
    await this.page.click('[data-testid="submit-btn"]');
    
    // Wait for creation success
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async joinTournament(tournamentName: string) {
    const tournamentCard = this.page.locator(`[data-testid="tournament-${tournamentName}"]`);
    await tournamentCard.locator('button:has-text("Join")').click();
    
    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="join-success"]');
  }

  async getTournamentList() {
    await this.page.waitForSelector('[data-testid="tournament-list"]');
    return this.page.locator('[data-testid^="tournament-"]').all();
  }
}

playwrightTest.describe('Tournament Management E2E', () => {
  let tournamentPage: TournamentPage;

  playwrightTest.beforeEach(async ({ page }) => {
    tournamentPage = new TournamentPage(page);
    
    // Setup test user session
    await page.goto('/auth/test-login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.click('[data-testid="login-btn"]');
    await page.waitForURL('/dashboard');
  });

  playwrightTest('should create and join tournament successfully', async ({ page }) => {
    // Arrange
    const tournamentData = {
      name: 'E2E Test Championship',
      entryFee: 75000,
      maxParticipants: 16
    };

    // Act - Navigate to tournaments
    await tournamentPage.navigate();

    // Act - Create tournament
    await tournamentPage.createTournament(tournamentData);

    // Assert - Tournament created
    await playwrightExpect(page.getByText(tournamentData.name)).toBeVisible();

    // Act - Join tournament (as different user)
    await page.goto('/auth/test-login');
    await page.fill('[data-testid="email"]', 'player2@example.com');
    await page.click('[data-testid="login-btn"]');
    
    await tournamentPage.navigate();
    await tournamentPage.joinTournament(tournamentData.name);

    // Assert - Successfully joined
    await playwrightExpect(page.getByText('Successfully joined tournament')).toBeVisible();
  });

  playwrightTest('should handle tournament full scenario', async ({ page }) => {
    // Arrange - Create tournament with 1 max participant
    const tournamentData = {
      name: 'Small Tournament',
      entryFee: 50000,
      maxParticipants: 1
    };

    await tournamentPage.navigate();
    await tournamentPage.createTournament(tournamentData);

    // Join as creator (fills the tournament)
    await tournamentPage.joinTournament(tournamentData.name);

    // Act - Try to join as another user
    await page.goto('/auth/test-login');
    await page.fill('[data-testid="email"]', 'player2@example.com');
    await page.click('[data-testid="login-btn"]');
    
    await tournamentPage.navigate();

    // Assert - Join button should be disabled
    const tournamentCard = page.locator(`[data-testid="tournament-${tournamentData.name}"]`);
    await playwrightExpect(tournamentCard.locator('button:has-text("Join")')).toBeDisabled();
    await playwrightExpect(page.getByText('Tournament Full')).toBeVisible();
  });
});

// ====================
// 5. PERFORMANCE TEST EXAMPLES
// ====================

playwrightTest.describe('Performance Tests', () => {
  playwrightTest('tournament list should load within performance budget', async ({ page }) => {
    // Start performance monitoring
    const startTime = Date.now();
    
    // Navigate to tournaments page
    await page.goto('/tournaments');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="tournament-list"]');
    
    const loadTime = Date.now() - startTime;
    
    // Assert performance requirements
    playwrightExpect(loadTime).toBeLessThan(3000); // 3 seconds max
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value
          })));
        });
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve([]), 5000);
      });
    });

    console.log('Performance metrics:', metrics);
  });

  playwrightTest('should handle large tournament list efficiently', async ({ page }) => {
    // Create many tournaments for performance testing
    await page.goto('/admin/seed-data');
    await page.click('[data-testid="seed-tournaments"]');
    await page.selectOption('[data-testid="count"]', '100');
    await page.click('[data-testid="create-btn"]');
    
    // Test performance with large dataset
    const startTime = Date.now();
    await page.goto('/tournaments');
    await page.waitForSelector('[data-testid="tournament-list"]');
    
    // Check that all tournaments loaded
    const tournamentCount = await page.locator('[data-testid^="tournament-"]').count();
    playwrightExpect(tournamentCount).toBeGreaterThan(50);
    
    const loadTime = Date.now() - startTime;
    playwrightExpect(loadTime).toBeLessThan(5000); // 5 seconds for large dataset
  });
});

// ====================
// 6. VISUAL REGRESSION TEST EXAMPLES
// ====================

playwrightTest.describe('Visual Regression Tests', () => {
  playwrightTest('tournament page visual consistency', async ({ page }) => {
    // Navigate to tournaments
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content for consistent screenshots
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"] { visibility: hidden !important; }
        .loading-spinner { display: none !important; }
        .animation-element { animation-duration: 0s !important; }
      `
    });
    
    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);
    
    // Take screenshot
    await playwrightExpect(page).toHaveScreenshot('tournament-page.png');
  });

  playwrightTest('tournament card variations', async ({ page }) => {
    await page.goto('/tournaments');
    
    // Screenshot different tournament states
    const activeCard = page.locator('[data-tournament-status="active"]').first();
    await playwrightExpect(activeCard).toHaveScreenshot('tournament-card-active.png');
    
    const fullCard = page.locator('[data-tournament-status="full"]').first();
    await playwrightExpect(fullCard).toHaveScreenshot('tournament-card-full.png');
    
    const completedCard = page.locator('[data-tournament-status="completed"]').first();
    await playwrightExpect(completedCard).toHaveScreenshot('tournament-card-completed.png');
  });
});

// ====================
// 7. ERROR HANDLING TEST EXAMPLES
// ====================

describe('Error Handling', () => {
  it('should handle network failures gracefully', async () => {
    // Arrange - Mock network failure
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    // Act
    const service = new TournamentService();
    const result = await service.getTournaments();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should retry failed requests', async () => {
    // Arrange - Mock intermittent failure
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({ 
        ok: true, 
        json: () => Promise.resolve([createMockTournament()]) 
      });
    
    global.fetch = mockFetch;

    // Act
    const service = new TournamentService({ retries: 1 });
    const result = await service.getTournaments();

    // Assert
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ====================
// 8. UTILITY FUNCTIONS FOR TESTING
// ====================

// Test database utilities
export async function setupTestDatabase() {
  // Setup test-specific database state
  await supabase.rpc('reset_test_data');
}

export async function cleanupTestDatabase() {
  // Clean up test data
  await supabase.from('tournament_registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function seedBaseData() {
  // Seed minimal required data
  const adminUser = createMockUser({ 
    id: 'admin-user-id',
    email: 'admin@test.com',
    isAdmin: true 
  });
  
  await supabase.from('profiles').insert(adminUser);
}

// Test assertion helpers
export function expectTournamentStructure(tournament: any) {
  expect(tournament).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    maxParticipants: expect.any(Number),
    entryFee: expect.any(Number),
    status: expect.stringMatching(/^(upcoming|active|completed|cancelled)$/),
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  });
}

export function expectApiResponse(response: any) {
  expect(response).toMatchObject({
    success: expect.any(Boolean),
    data: response.success ? expect.anything() : undefined,
    error: !response.success ? expect.any(String) : undefined
  });
}

// Performance measurement helpers
export async function measurePageLoad(page: any, url: string) {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}

export async function measureMemoryUsage(page: any) {
  return await page.evaluate(() => {
    const memory = (performance as any).memory;
    return memory ? {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    } : null;
  });
}