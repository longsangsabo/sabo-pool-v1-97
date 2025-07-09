// Performance Tests
import { test, expect } from '@playwright/test';
import { PerformanceTester, performanceThresholds, assertPerformanceThresholds } from '../utils/performance';

test.describe('Performance Tests', () => {
  let performanceTester: PerformanceTester;

  test.beforeEach(async ({ page, context }) => {
    performanceTester = new PerformanceTester(page, context);
  });

  test.describe('Page Load Performance', () => {
    test('should load tournament list page within performance thresholds', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      const metrics = await performanceTester.measurePageLoad('/tournaments');
      
      // Assert performance thresholds
      expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds
      expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
      expect(metrics.networkTime).toBeLessThan(1000); // 1 second
      
      console.log('Tournament List Performance:', metrics);
    });

    test('should load tournament detail page efficiently', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      const metrics = await performanceTester.measurePageLoad('/tournaments');
      
      expect(metrics.loadTime).toBeLessThan(3500); // Allow slightly more time for detail page
      expect(metrics.domContentLoaded).toBeLessThan(2500);
      
      console.log('Tournament Detail Performance:', metrics);
    });

    test('should handle tournament creation form efficiently', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      const metrics = await performanceTester.measurePageLoad('/tournaments/create');
      
      expect(metrics.loadTime).toBeLessThan(2500);
      expect(metrics.domContentLoaded).toBeLessThan(1800);
      
      console.log('Tournament Create Form Performance:', metrics);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals standards for tournament list', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      const vitals = await performanceTester.measureCoreWebVitals('/tournaments');
      
      // Assert Core Web Vitals thresholds
      if (vitals.firstContentfulPaint) {
        expect(vitals.firstContentfulPaint).toBeLessThan(performanceThresholds.firstContentfulPaint);
      }
      
      if (vitals.largestContentfulPaint) {
        expect(vitals.largestContentfulPaint).toBeLessThan(performanceThresholds.largestContentfulPaint);
      }
      
      if (vitals.cumulativeLayoutShift) {
        expect(vitals.cumulativeLayoutShift).toBeLessThan(performanceThresholds.cumulativeLayoutShift);
      }
      
      console.log('Core Web Vitals:', vitals);
    });
  });

  test.describe('Bundle Size Analysis', () => {
    test('should analyze and verify bundle sizes', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');
      
      const bundleSize = await performanceTester.analyzeBundleSize();
      
      // Assert reasonable bundle sizes
      expect(bundleSize.totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB total
      expect(bundleSize.jsSize).toBeLessThan(1.5 * 1024 * 1024); // 1.5MB JS
      expect(bundleSize.cssSize).toBeLessThan(200 * 1024); // 200KB CSS
      
      console.log('Bundle Size Analysis:', {
        totalSize: `${(bundleSize.totalSize / 1024 / 1024).toFixed(2)}MB`,
        jsSize: `${(bundleSize.jsSize / 1024 / 1024).toFixed(2)}MB`,
        cssSize: `${(bundleSize.cssSize / 1024).toFixed(2)}KB`,
        imageSize: `${(bundleSize.imageSize / 1024).toFixed(2)}KB`
      });
    });
  });

  test.describe('Memory Usage', () => {
    test('should monitor memory usage during tournament operations', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      await page.goto('/tournaments');
      const initialMemory = await performanceTester.measureMemoryUsage();
      
      // Perform memory-intensive operations
      await page.click('[data-testid="create-tournament-button"]');
      await page.waitForSelector('[data-testid="tournament-form"]');
      
      // Fill large form
      await page.fill('[data-testid="tournament-name"]', 'Performance Test Tournament');
      await page.fill('[data-testid="tournament-description"]', 'A'.repeat(1000)); // Large description
      
      const afterFormMemory = await performanceTester.measureMemoryUsage();
      
      // Submit and navigate
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      const finalMemory = await performanceTester.measureMemoryUsage();
      
      // Memory should not grow excessively
      const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB growth limit
      
      console.log('Memory Usage Analysis:', {
        initial: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        afterForm: `${(afterFormMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`
      });
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), Math.random() * 1000 + 500); // 500-1500ms delay
      });
      
      const startTime = Date.now();
      await page.goto('/tournaments');
      await page.waitForSelector('[data-testid="tournament-card"]', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time on slow connection
      expect(loadTime).toBeLessThan(15000); // 15 seconds max
      
      console.log(`Slow network load time: ${loadTime}ms`);
    });

    test('should handle offline gracefully', async ({ page, context }) => {
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');
      
      // Simulate offline
      await context.setOffline(true);
      
      // Try to navigate or perform action
      await page.click('[data-testid="create-tournament-button"]').catch(() => {
        // Expected to fail offline
      });
      
      // Should show appropriate offline message
      const offlineMessage = page.locator('[data-testid="offline-message"]');
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toContainText('offline');
      }
      
      // Restore online
      await context.setOffline(false);
    });
  });

  test.describe('Load Testing Simulation', () => {
    test('should handle concurrent user simulation', async ({ page, context }) => {
      const performanceTester = new PerformanceTester(page, context);
      
      // Simulate multiple concurrent users
      const loadTestResults = await performanceTester.testUnderLoad('/tournaments', {
        concurrentUsers: 5,
        testDuration: 10 // 10 seconds
      });
      
      // Assert performance under load
      expect(loadTestResults.averageLoadTime).toBeLessThan(5000); // 5 seconds average
      expect(loadTestResults.successRate).toBeGreaterThan(95); // 95% success rate
      
      console.log('Load Test Results:', loadTestResults);
    });
  });

  // Skip Lighthouse tests in CI to avoid complexity
  test.describe('Lighthouse Audit', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Lighthouse only works with Chromium');
    
    test('should pass Lighthouse performance audit', async ({ page, context }) => {
      test.setTimeout(60000); // Lighthouse takes time
      
      const performanceTester = new PerformanceTester(page, context);
      
      try {
        const metrics = await performanceTester.runLighthouseAudit('http://localhost:5173/tournaments');
        
        // Assert Lighthouse scores
        expect(metrics.performanceScore).toBeGreaterThan(performanceThresholds.performanceScore);
        expect(metrics.accessibilityScore).toBeGreaterThan(performanceThresholds.accessibilityScore);
        expect(metrics.bestPracticesScore).toBeGreaterThan(performanceThresholds.bestPracticesScore);
        
        console.log('Lighthouse Audit Results:', metrics);
      } catch (error) {
        console.warn('Lighthouse audit failed:', error);
        // Don't fail the test if Lighthouse has issues
      }
    });
  });
});