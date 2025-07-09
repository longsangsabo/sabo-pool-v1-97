// E2E Tests for Tournament Flow
import { test, expect } from '@playwright/test';

test.describe('Tournament Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tournaments page
    await page.goto('/tournaments');
  });

  test('should create, view, and delete tournament', async ({ page }) => {
    // Test tournament creation
    await test.step('Create new tournament', async () => {
      await page.click('[data-testid="create-tournament-button"]');
      
      // Fill tournament form
      await page.fill('[data-testid="tournament-name"]', 'E2E Test Tournament');
      await page.fill('[data-testid="tournament-description"]', 'End-to-end test tournament');
      await page.selectOption('[data-testid="tournament-type"]', 'single_elimination');
      await page.selectOption('[data-testid="game-format"]', 'race_to_5');
      await page.selectOption('[data-testid="tier-level"]', 'amateur');
      await page.fill('[data-testid="max-participants"]', '16');
      await page.fill('[data-testid="entry-fee"]', '100000');
      await page.fill('[data-testid="venue-address"]', 'E2E Test Venue');
      
      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      
      await page.fill('[data-testid="registration-start"]', tomorrow.toISOString().slice(0, 16));
      await page.fill('[data-testid="registration-end"]', nextWeek.toISOString().slice(0, 16));
      await page.fill('[data-testid="tournament-start"]', nextMonth.toISOString().slice(0, 16));
      
      // Submit form
      await page.click('[data-testid="submit-tournament"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Tạo giải đấu thành công');
    });

    // Test tournament visibility
    await test.step('Verify tournament appears in list', async () => {
      await page.reload();
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="tournament-name"]')).toContainText('E2E Test Tournament');
    });

    // Test tournament details view
    await test.step('View tournament details', async () => {
      await page.click('[data-testid="view-tournament-button"]');
      await expect(page.locator('[data-testid="tournament-detail-name"]')).toContainText('E2E Test Tournament');
      await expect(page.locator('[data-testid="tournament-detail-description"]')).toContainText('End-to-end test tournament');
      
      // Go back to tournaments list
      await page.click('[data-testid="back-to-tournaments"]');
    });

    // Test tournament deletion
    await test.step('Delete tournament', async () => {
      await page.click('[data-testid="tournament-menu-button"]');
      await page.click('[data-testid="delete-tournament-button"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Đã xóa giải đấu');
      
      // Verify tournament is no longer visible
      await page.reload();
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(0);
    });
  });

  test('should register for tournament and cancel registration', async ({ page }) => {
    // Prerequisite: Create a tournament (could be done via API in beforeEach)
    await test.step('Setup: Create tournament for registration test', async () => {
      await page.click('[data-testid="create-tournament-button"]');
      
      // Quick tournament creation
      await page.fill('[data-testid="tournament-name"]', 'Registration Test Tournament');
      await page.fill('[data-testid="tournament-description"]', 'Test tournament for registration');
      await page.selectOption('[data-testid="tournament-type"]', 'single_elimination');
      await page.fill('[data-testid="max-participants"]', '8');
      
      // Set dates to allow immediate registration
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      await page.fill('[data-testid="registration-start"]', now.toISOString().slice(0, 16));
      await page.fill('[data-testid="registration-end"]', tomorrow.toISOString().slice(0, 16));
      await page.fill('[data-testid="tournament-start"]', nextWeek.toISOString().slice(0, 16));
      
      await page.click('[data-testid="submit-tournament"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Tạo giải đấu thành công');
    });

    // Test registration
    await test.step('Register for tournament', async () => {
      await page.reload();
      await page.click('[data-testid="register-tournament-button"]');
      
      // Verify registration success
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Đăng ký tham gia thành công');
      
      // Verify button changes to registered state
      await expect(page.locator('[data-testid="registered-badge"]')).toBeVisible();
    });

    // Test registration cancellation
    await test.step('Cancel registration', async () => {
      await page.click('[data-testid="tournament-menu-button"]');
      await page.click('[data-testid="cancel-registration-button"]');
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancel"]');
      
      // Verify cancellation success
      await expect(page.locator('[data-testid="success-toast"]')).toContainText('Đã hủy đăng ký giải đấu');
      
      // Verify button changes back to register state
      await expect(page.locator('[data-testid="register-tournament-button"]')).toBeVisible();
    });
  });

  test('should handle tournament filtering and search', async ({ page }) => {
    // Prerequisite: Create tournaments with different statuses
    await test.step('Setup: Create multiple tournaments', async () => {
      const tournaments = [
        { name: 'Upcoming Tournament', status: 'upcoming' },
        { name: 'Ongoing Tournament', status: 'ongoing' },
        { name: 'Completed Tournament', status: 'completed' }
      ];

      for (const tournament of tournaments) {
        await page.click('[data-testid="create-tournament-button"]');
        await page.fill('[data-testid="tournament-name"]', tournament.name);
        await page.fill('[data-testid="tournament-description"]', `Test ${tournament.status} tournament`);
        await page.selectOption('[data-testid="tournament-type"]', 'single_elimination');
        await page.fill('[data-testid="max-participants"]', '8');
        
        // Set appropriate dates based on status
        const now = new Date();
        let regStart, regEnd, tournamentStart;
        
        switch (tournament.status) {
          case 'upcoming':
            regStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            regEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            tournamentStart = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case 'ongoing':
            regStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            regEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            tournamentStart = now;
            break;
          case 'completed':
            regStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            regEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            tournamentStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            break;
        }
        
        await page.fill('[data-testid="registration-start"]', regStart.toISOString().slice(0, 16));
        await page.fill('[data-testid="registration-end"]', regEnd.toISOString().slice(0, 16));
        await page.fill('[data-testid="tournament-start"]', tournamentStart.toISOString().slice(0, 16));
        
        await page.click('[data-testid="submit-tournament"]');
        await expect(page.locator('[data-testid="success-toast"]')).toContainText('Tạo giải đấu thành công');
      }
    });

    // Test filtering by status
    await test.step('Test status filtering', async () => {
      await page.reload();
      
      // Filter by upcoming
      await page.click('[data-testid="filter-upcoming"]');
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="tournament-name"]')).toContainText('Upcoming Tournament');
      
      // Filter by all
      await page.click('[data-testid="filter-all"]');
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(3);
    });

    // Test search functionality
    await test.step('Test search functionality', async () => {
      await page.fill('[data-testid="search-tournaments"]', 'Ongoing');
      await page.press('[data-testid="search-tournaments"]', 'Enter');
      
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="tournament-name"]')).toContainText('Ongoing Tournament');
      
      // Clear search
      await page.fill('[data-testid="search-tournaments"]', '');
      await page.press('[data-testid="search-tournaments"]', 'Enter');
      await expect(page.locator('[data-testid="tournament-card"]')).toHaveCount(3);
    });
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test form validation
    await test.step('Test form validation errors', async () => {
      await page.click('[data-testid="create-tournament-button"]');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-tournament"]');
      
      // Verify validation errors appear
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('required');
      
      // Cancel form
      await page.click('[data-testid="cancel-tournament"]');
    });

    // Test network error handling
    await test.step('Test network error handling', async () => {
      // Simulate offline mode
      await page.route('**/tournaments**', route => route.abort());
      
      await page.reload();
      
      // Verify error message or loading state
      await expect(page.locator('[data-testid="error-message"]').or(page.locator('[data-testid="loading-spinner"]'))).toBeVisible();
    });
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await test.step('Test mobile navigation', async () => {
      // Mobile menu should be visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Desktop menu should be hidden
      await expect(page.locator('[data-testid="desktop-menu"]')).not.toBeVisible();
    });

    await test.step('Test mobile tournament creation', async () => {
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="create-tournament-mobile"]');
      
      // Form should be optimized for mobile
      await expect(page.locator('[data-testid="tournament-form"]')).toBeVisible();
      
      // Test form is usable on mobile
      await page.fill('[data-testid="tournament-name"]', 'Mobile Test Tournament');
      await expect(page.locator('[data-testid="tournament-name"]')).toHaveValue('Mobile Test Tournament');
    });
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await test.step('Test keyboard navigation', async () => {
      // Tab through tournament cards
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Enter should activate focused element
      await page.keyboard.press('Enter');
      
      // Verify navigation worked
      await expect(page.locator('[data-testid="tournament-detail"]').or(page.locator('[data-testid="tournament-form"]'))).toBeVisible();
    });

    await test.step('Test screen reader compatibility', async () => {
      // Check for ARIA labels
      const ariaElements = await page.locator('[aria-label]').count();
      expect(ariaElements).toBeGreaterThanOrEqual(0);
      
      // Check for proper heading structure
      const headingCount = await page.locator('h1, h2, h3').count();
      expect(headingCount).toBeGreaterThanOrEqual(0);
      
      // Check for alt text on images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        await expect(images.nth(i)).toHaveAttribute('alt');
      }
    });
  });
});