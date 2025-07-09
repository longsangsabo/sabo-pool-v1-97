import { Page, BrowserContext } from '@playwright/test';
import lighthouse from 'lighthouse';
import { launch } from 'puppeteer';

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
}

export class PerformanceTester {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  /**
   * Measure Core Web Vitals using Playwright
   */
  async measureCoreWebVitals(url: string): Promise<Partial<PerformanceMetrics>> {
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Inject Web Vitals measurement script
    const webVitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};
        let metricsCollected = 0;
        const expectedMetrics = 3;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime;
              metricsCollected++;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.largestContentfulPaint = entry.startTime;
              metricsCollected++;
            }
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              metrics.cumulativeLayoutShift = (metrics.cumulativeLayoutShift || 0) + (entry as any).value;
            }
          }

          if (metricsCollected >= expectedMetrics) {
            resolve(metrics);
          }
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });

        // Fallback timeout
        setTimeout(() => resolve(metrics), 10000);
      });
    });

    return webVitals as Partial<PerformanceMetrics>;
  }

  /**
   * Run Lighthouse audit
   */
  async runLighthouseAudit(url: string): Promise<PerformanceMetrics> {
    const browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const result = await lighthouse(url, {
        port: 9222,
        output: 'json',
        logLevel: 'info'
      });

      if (!result) {
        throw new Error('Lighthouse audit failed');
      }

      const audits = result.lhr.audits;
      const categories = result.lhr.categories;

      return {
        firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
        largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
        firstInputDelay: audits['max-potential-fid']?.numericValue || 0,
        cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
        totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
        speedIndex: audits['speed-index']?.numericValue || 0,
        timeToInteractive: audits['interactive']?.numericValue || 0,
        performanceScore: Math.round((categories.performance?.score || 0) * 100),
        accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
        bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
        seoScore: Math.round((categories.seo?.score || 0) * 100)
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Measure page load performance
   */
  async measurePageLoad(url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    networkTime: number;
    renderTime: number;
  }> {
    const startTime = Date.now();
    
    await this.page.goto(url, { waitUntil: 'load' });
    const loadTime = Date.now() - startTime;

    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        networkTime: navigation.responseEnd - navigation.requestStart,
        renderTime: navigation.loadEventEnd - navigation.responseEnd
      };
    });

    return {
      loadTime,
      ...performanceMetrics
    };
  }

  /**
   * Test bundle size impact
   */
  async analyzeBundleSize(): Promise<{
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
  }> {
    const resources = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;

      entries.forEach(entry => {
        const transferSize = (entry as any).transferSize || 0;
        totalSize += transferSize;

        if (entry.name.includes('.js')) {
          jsSize += transferSize;
        } else if (entry.name.includes('.css')) {
          cssSize += transferSize;
        } else if (entry.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          imageSize += transferSize;
        }
      });

      return { totalSize, jsSize, cssSize, imageSize };
    });

    return resources;
  }

  /**
   * Memory usage testing
   */
  async measureMemoryUsage(): Promise<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }> {
    const memoryInfo = await this.page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      };
    });

    return memoryInfo;
  }

  /**
   * Test performance under load (simulated)
   */
  async testUnderLoad(url: string, options: {
    concurrentUsers: number;
    testDuration: number; // in seconds
  }): Promise<{
    averageLoadTime: number;
    maxLoadTime: number;
    minLoadTime: number;
    successRate: number;
  }> {
    const { concurrentUsers, testDuration } = options;
    const loadTimes: number[] = [];
    const errors: number[] = [];
    
    const startTime = Date.now();
    const endTime = startTime + (testDuration * 1000);

    const promises = Array.from({ length: concurrentUsers }, async () => {
      while (Date.now() < endTime) {
        try {
          const testStartTime = Date.now();
          await this.page.goto(url, { waitUntil: 'networkidle' });
          const testLoadTime = Date.now() - testStartTime;
          loadTimes.push(testLoadTime);
        } catch (error) {
          errors.push(1);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    await Promise.all(promises);

    const totalRequests = loadTimes.length + errors.length;
    const successRate = totalRequests > 0 ? (loadTimes.length / totalRequests) * 100 : 0;

    return {
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
      maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
      minLoadTime: loadTimes.length > 0 ? Math.min(...loadTimes) : 0,
      successRate
    };
  }
}

/**
 * Performance thresholds for different metrics
 */
export const performanceThresholds = {
  firstContentfulPaint: 1800, // ms
  largestContentfulPaint: 2500, // ms
  firstInputDelay: 100, // ms
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 200, // ms
  speedIndex: 3400, // ms
  timeToInteractive: 3800, // ms
  performanceScore: 90, // Lighthouse score
  accessibilityScore: 95,
  bestPracticesScore: 90,
  seoScore: 90
};

/**
 * Assert performance metrics meet thresholds
 */
export function assertPerformanceThresholds(metrics: PerformanceMetrics, customThresholds?: Partial<typeof performanceThresholds>) {
  const thresholds = { ...performanceThresholds, ...customThresholds };
  
  const assertions = [
    { metric: 'First Contentful Paint', value: metrics.firstContentfulPaint, threshold: thresholds.firstContentfulPaint, unit: 'ms' },
    { metric: 'Largest Contentful Paint', value: metrics.largestContentfulPaint, threshold: thresholds.largestContentfulPaint, unit: 'ms' },
    { metric: 'First Input Delay', value: metrics.firstInputDelay, threshold: thresholds.firstInputDelay, unit: 'ms' },
    { metric: 'Cumulative Layout Shift', value: metrics.cumulativeLayoutShift, threshold: thresholds.cumulativeLayoutShift, unit: '' },
    { metric: 'Total Blocking Time', value: metrics.totalBlockingTime, threshold: thresholds.totalBlockingTime, unit: 'ms' },
    { metric: 'Speed Index', value: metrics.speedIndex, threshold: thresholds.speedIndex, unit: 'ms' },
    { metric: 'Time to Interactive', value: metrics.timeToInteractive, threshold: thresholds.timeToInteractive, unit: 'ms' },
    { metric: 'Performance Score', value: metrics.performanceScore, threshold: thresholds.performanceScore, unit: '' },
    { metric: 'Accessibility Score', value: metrics.accessibilityScore, threshold: thresholds.accessibilityScore, unit: '' },
    { metric: 'Best Practices Score', value: metrics.bestPracticesScore, threshold: thresholds.bestPracticesScore, unit: '' },
    { metric: 'SEO Score', value: metrics.seoScore, threshold: thresholds.seoScore, unit: '' }
  ];

  const failures: string[] = [];

  assertions.forEach(({ metric, value, threshold, unit }) => {
    if (value > threshold) {
      failures.push(`${metric}: ${value}${unit} exceeds threshold of ${threshold}${unit}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`Performance thresholds exceeded:\n${failures.join('\n')}`);
  }
}