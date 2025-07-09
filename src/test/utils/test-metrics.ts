// Test Metrics Collection and Monitoring
import { performance } from 'perf_hooks';

export interface TestMetrics {
  testName: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  timestamp: string;
  browser?: string;
  viewport?: string;
  memoryUsage?: number;
  networkRequests?: number;
  assertions?: number;
  retryCount?: number;
  errorMessage?: string;
  tags?: string[];
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
}

export interface TestSuiteMetrics {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: number;
  timestamp: string;
}

class TestMetricsCollector {
  private metrics: TestMetrics[] = [];
  private suiteMetrics: TestSuiteMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];

  // Collect individual test metrics
  collectTestMetric(metric: TestMetrics) {
    this.metrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });
  }

  // Collect test suite metrics
  collectSuiteMetric(metric: TestSuiteMetrics) {
    this.suiteMetrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });
  }

  // Collect performance metrics
  collectPerformanceMetric(metric: PerformanceMetrics) {
    this.performanceMetrics.push(metric);
  }

  // Get metrics summary
  getMetricsSummary() {
    const totalTests = this.metrics.length;
    const passedTests = this.metrics.filter(m => m.status === 'passed').length;
    const failedTests = this.metrics.filter(m => m.status === 'failed').length;
    const skippedTests = this.metrics.filter(m => m.status === 'skipped').length;
    
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalTests;
    const avgRetries = this.metrics.reduce((sum, m) => sum + (m.retryCount || 0), 0) / totalTests;

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate: (passedTests / totalTests) * 100,
      avgDuration,
      avgRetries,
      timestamp: new Date().toISOString(),
    };
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.performanceMetrics.length === 0) return null;

    const metrics = this.performanceMetrics;
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    const avgLCP = metrics.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / metrics.length;
    const avgCLS = metrics.reduce((sum, m) => sum + m.cumulativeLayoutShift, 0) / metrics.length;
    const avgFID = metrics.reduce((sum, m) => sum + m.firstInputDelay, 0) / metrics.length;

    return {
      avgLoadTime,
      avgLCP,
      avgCLS,
      avgFID,
      totalMeasurements: metrics.length,
    };
  }

  // Export metrics to different formats
  exportToJSON() {
    return {
      testMetrics: this.metrics,
      suiteMetrics: this.suiteMetrics,
      performanceMetrics: this.performanceMetrics,
      summary: this.getMetricsSummary(),
      performanceSummary: this.getPerformanceSummary(),
      exportedAt: new Date().toISOString(),
    };
  }

  exportToCSV() {
    const headers = [
      'testName', 'duration', 'status', 'timestamp', 'browser', 
      'viewport', 'memoryUsage', 'networkRequests', 'assertions', 'retryCount'
    ];
    
    const rows = this.metrics.map(metric => [
      metric.testName,
      metric.duration,
      metric.status,
      metric.timestamp,
      metric.browser || '',
      metric.viewport || '',
      metric.memoryUsage || '',
      metric.networkRequests || '',
      metric.assertions || '',
      metric.retryCount || 0,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
    this.suiteMetrics = [];
    this.performanceMetrics = [];
  }

  // Get failing tests
  getFailingTests() {
    return this.metrics.filter(m => m.status === 'failed');
  }

  // Get slow tests
  getSlowTests(threshold = 5000) {
    return this.metrics.filter(m => m.duration > threshold);
  }

  // Get flaky tests (tests that required retries)
  getFlakyTests() {
    return this.metrics.filter(m => (m.retryCount || 0) > 0);
  }

  // Performance monitoring utilities
  startPerformanceMonitoring() {
    const startTime = performance.now();
    return {
      end: () => performance.now() - startTime,
      mark: (name: string) => performance.mark(name),
      measure: (name: string, start: string, end: string) => 
        performance.measure(name, start, end),
    };
  }

  // Memory usage monitoring
  getMemoryUsage() {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    return null;
  }

  // Network monitoring
  monitorNetworkRequests() {
    let requestCount = 0;
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      requestCount++;
      return originalFetch(...args);
    };

    return {
      getRequestCount: () => requestCount,
      resetCount: () => { requestCount = 0; },
      restore: () => { window.fetch = originalFetch; },
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new TestMetricsCollector();

// Decorator for automatic test metrics collection
export function collectMetrics(testName: string, tags: string[] = []) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const startTime = performance.now();
      let status: 'passed' | 'failed' = 'passed';
      let errorMessage: string | undefined;
      
      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        status = 'failed';
        errorMessage = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        const duration = performance.now() - startTime;
        metricsCollector.collectTestMetric({
          testName,
          duration,
          status,
          timestamp: new Date().toISOString(),
          errorMessage,
          tags,
        });
      }
    };
  };
}

// Utility functions
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  throw lastError!;
};

// Test stability monitoring
export class TestStabilityMonitor {
  private testHistory: Map<string, Array<{ status: string; timestamp: string }>> = new Map();

  recordTestResult(testName: string, status: 'passed' | 'failed' | 'skipped') {
    if (!this.testHistory.has(testName)) {
      this.testHistory.set(testName, []);
    }
    
    const history = this.testHistory.get(testName)!;
    history.push({ status, timestamp: new Date().toISOString() });
    
    // Keep only last 10 runs
    if (history.length > 10) {
      history.shift();
    }
  }

  getTestStability(testName: string) {
    const history = this.testHistory.get(testName);
    if (!history || history.length === 0) return null;

    const passedCount = history.filter(h => h.status === 'passed').length;
    const stability = (passedCount / history.length) * 100;
    
    return {
      stability,
      totalRuns: history.length,
      passedRuns: passedCount,
      isFlaky: stability < 90 && stability > 0,
      recentFailures: history.slice(-3).filter(h => h.status === 'failed').length,
    };
  }

  getFlakyTests(threshold = 90) {
    const flakyTests: Array<{ testName: string; stability: number }> = [];
    
    for (const [testName] of this.testHistory) {
      const stability = this.getTestStability(testName);
      if (stability && stability.stability < threshold && stability.stability > 0) {
        flakyTests.push({ testName, stability: stability.stability });
      }
    }
    
    return flakyTests.sort((a, b) => a.stability - b.stability);
  }
}

export const stabilityMonitor = new TestStabilityMonitor();
