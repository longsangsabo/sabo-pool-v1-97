import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class VisualRegressionTester {
  private page: Page;
  private screenshotDir: string;

  constructor(page: Page) {
    this.page = page;
    this.screenshotDir = path.join(process.cwd(), 'src/test/screenshots');
    this.ensureScreenshotDir();
  }

  private ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Take a full page screenshot and compare with baseline
   */
  async compareFullPage(testName: string, options?: {
    threshold?: number;
    maskSelectors?: string[];
    animations?: 'disabled' | 'allow';
  }) {
    const { threshold = 0.2, maskSelectors = [], animations = 'disabled' } = options || {};

    // Disable animations for consistent screenshots
    if (animations === 'disabled') {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });
    }

    // Hide dynamic elements
    for (const selector of maskSelectors) {
      await this.page.locator(selector).evaluateAll(elements => {
        elements.forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });
    }

    // Wait for page to be stable
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Additional wait for animations

    // Take screenshot and compare
    await expect(this.page).toHaveScreenshot(`${testName}-full-page.png`, {
      threshold,
      fullPage: true
    });
  }

  /**
   * Compare a specific component
   */
  async compareComponent(selector: string, testName: string, options?: {
    threshold?: number;
    animations?: 'disabled' | 'allow';
  }) {
    const { threshold = 0.2, animations = 'disabled' } = options || {};

    if (animations === 'disabled') {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });
    }

    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(200);

    await expect(element).toHaveScreenshot(`${testName}-component.png`, {
      threshold
    });
  }

  /**
   * Test responsive design across different viewports
   */
  async testResponsiveDesign(testName: string, viewports: Array<{ width: number; height: number; name: string }>) {
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Wait for layout to settle
      
      await expect(this.page).toHaveScreenshot(`${testName}-${viewport.name}.png`, {
        threshold: 0.2,
        fullPage: true
      });
    }
  }

  /**
   * Test component states (hover, focus, etc.)
   */
  async testComponentStates(selector: string, testName: string, states: Array<{
    name: string;
    action: () => Promise<void>;
  }>) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });

    for (const state of states) {
      await state.action();
      await this.page.waitForTimeout(100);
      
      await expect(element).toHaveScreenshot(`${testName}-${state.name}.png`, {
        threshold: 0.1
      });
    }
  }

  /**
   * Compare dark vs light theme
   */
  async compareThemes(testName: string, options?: {
    darkModeToggleSelector?: string;
    waitAfterToggle?: number;
  }) {
    const { darkModeToggleSelector = '[data-testid="theme-toggle"]', waitAfterToggle = 500 } = options || {};

    // Take light theme screenshot
    await expect(this.page).toHaveScreenshot(`${testName}-light-theme.png`, {
      threshold: 0.2,
      fullPage: true
    });

    // Toggle to dark theme
    const themeToggle = this.page.locator(darkModeToggleSelector);
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await this.page.waitForTimeout(waitAfterToggle);
      
      // Take dark theme screenshot
      await expect(this.page).toHaveScreenshot(`${testName}-dark-theme.png`, {
        threshold: 0.2,
        fullPage: true
      });
    }
  }
}

/**
 * Utility function to create standardized test viewports
 */
export const standardViewports = {
  mobile: { width: 375, height: 667, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1440, height: 900, name: 'desktop' },
  widescreen: { width: 1920, height: 1080, name: 'widescreen' }
};

/**
 * Common element selectors that should be masked in screenshots
 */
export const commonMaskSelectors = [
  '[data-testid="timestamp"]',
  '[data-testid="live-indicator"]',
  '.animate-pulse',
  '.animate-spin',
  '[data-testid="real-time-data"]'
];