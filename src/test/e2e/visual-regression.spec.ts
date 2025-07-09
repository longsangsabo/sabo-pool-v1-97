// Visual Regression Tests
import { test, expect } from '@playwright/test';
import { VisualRegressionTester, standardViewports, commonMaskSelectors } from '../utils/visual-regression';

test.describe('Visual Regression Tests', () => {
  let visualTester: VisualRegressionTester;

  test.beforeEach(async ({ page }) => {
    visualTester = new VisualRegressionTester(page);
  });

  test.describe('Tournament Pages', () => {
    test('should match tournament list page design', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      await visualTester.compareFullPage('tournament-list', {
        maskSelectors: [...commonMaskSelectors, '[data-testid="tournament-countdown"]']
      });
    });

    test('should match tournament detail page design', async ({ page }) => {
      await page.goto('/tournaments');
      
      // Wait for tournaments to load and click first one
      await page.waitForSelector('[data-testid="tournament-card"]');
      await page.click('[data-testid="tournament-card"]:first-child');
      await page.waitForLoadState('networkidle');

      await visualTester.compareFullPage('tournament-detail', {
        maskSelectors: [...commonMaskSelectors, '[data-testid="registration-countdown"]']
      });
    });

    test('should match tournament creation form', async ({ page }) => {
      await page.goto('/tournaments/create');
      await page.waitForLoadState('networkidle');

      await visualTester.compareFullPage('tournament-create-form');
    });
  });

  test.describe('Responsive Design', () => {
    test('should render correctly across different viewports', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      await visualTester.testResponsiveDesign('tournament-list-responsive', [
        standardViewports.mobile,
        standardViewports.tablet,
        standardViewports.desktop,
        standardViewports.widescreen
      ]);
    });
  });

  test.describe('Component States', () => {
    test('should capture button states correctly', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForSelector('[data-testid="create-tournament-button"]');

      await visualTester.testComponentStates(
        '[data-testid="create-tournament-button"]',
        'create-tournament-button',
        [
          {
            name: 'default',
            action: async () => {
              // Default state - no action needed
            }
          },
          {
            name: 'hover',
            action: async () => {
              await page.hover('[data-testid="create-tournament-button"]');
            }
          },
          {
            name: 'focus',
            action: async () => {
              await page.focus('[data-testid="create-tournament-button"]');
            }
          }
        ]
      );
    });

    test('should capture tournament card states', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForSelector('[data-testid="tournament-card"]');

      await visualTester.testComponentStates(
        '[data-testid="tournament-card"]:first-child',
        'tournament-card',
        [
          {
            name: 'default',
            action: async () => {
              // Default state
            }
          },
          {
            name: 'hover',
            action: async () => {
              await page.hover('[data-testid="tournament-card"]:first-child');
            }
          }
        ]
      );
    });
  });

  test.describe('Theme Comparison', () => {
    test('should compare light and dark themes', async ({ page }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      await visualTester.compareThemes('tournament-list-themes', {
        darkModeToggleSelector: '[data-testid="theme-toggle"]'
      });
    });
  });

  test.describe('Form Components', () => {
    test('should capture form states correctly', async ({ page }) => {
      await page.goto('/tournaments/create');
      await page.waitForLoadState('networkidle');

      // Test form field states
      const formFields = [
        '[data-testid="tournament-name"]',
        '[data-testid="tournament-description"]',
        '[data-testid="tournament-type"]'
      ];

      for (const field of formFields) {
        const fieldName = field.replace(/\[data-testid="([^"]+)"\]/, '$1');
        
        await visualTester.testComponentStates(field, fieldName, [
          {
            name: 'empty',
            action: async () => {
              await page.fill(field, '');
            }
          },
          {
            name: 'filled',
            action: async () => {
              if (field.includes('select')) {
                await page.selectOption(field, { index: 1 });
              } else {
                await page.fill(field, 'Test Value');
              }
            }
          },
          {
            name: 'focused',
            action: async () => {
              await page.focus(field);
            }
          }
        ]);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should capture loading states', async ({ page }) => {
      // Intercept API calls to simulate loading
      await page.route('**/tournaments*', route => {
        setTimeout(() => route.continue(), 2000);
      });

      await page.goto('/tournaments');
      
      // Capture loading state
      await visualTester.compareComponent('[data-testid="loading-spinner"]', 'tournament-list-loading');
      
      // Wait for load to complete
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Error States', () => {
    test('should capture error states correctly', async ({ page }) => {
      // Mock API error
      await page.route('**/tournaments*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/tournaments');
      await page.waitForSelector('[data-testid="error-message"]');

      await visualTester.compareComponent('[data-testid="error-message"]', 'tournament-list-error');
    });
  });
});