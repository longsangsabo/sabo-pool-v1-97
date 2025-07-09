// Advanced Test Monitoring and Alerting System
import { TestMetrics, TestSuiteMetrics } from './test-metrics';

export interface AlertConfig {
  type: 'email' | 'slack' | 'webhook';
  threshold: {
    failureRate?: number;
    duration?: number;
    flakyTests?: number;
    coverage?: number;
  };
  recipients?: string[];
  webhookUrl?: string;
  enabled: boolean;
}

export interface TestAlert {
  id: string;
  type: 'failure_rate' | 'performance' | 'flaky_test' | 'coverage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  data: any;
  resolved: boolean;
}

export interface MonitoringDashboard {
  testTrends: {
    passRate: number[];
    avgDuration: number[];
    coverage: number[];
    timestamps: string[];
  };
  alerts: TestAlert[];
  metrics: {
    totalTests: number;
    passRate: number;
    avgDuration: number;
    coverage: number;
    flakyTests: number;
  };
}

class TestMonitor {
  private alerts: TestAlert[] = [];
  private config: AlertConfig;
  private metrics: TestMetrics[] = [];
  private suiteMetrics: TestSuiteMetrics[] = [];

  constructor(config: AlertConfig) {
    this.config = config;
  }

  // Add test metrics for monitoring
  addMetrics(metrics: TestMetrics[], suiteMetrics: TestSuiteMetrics[] = []) {
    this.metrics.push(...metrics);
    this.suiteMetrics.push(...suiteMetrics);
    this.checkThresholds();
  }

  // Check if any thresholds are breached
  private checkThresholds() {
    if (!this.config.enabled) return;

    this.checkFailureRate();
    this.checkPerformance();
    this.checkFlakyTests();
    this.checkCoverage();
  }

  // Check failure rate threshold
  private checkFailureRate() {
    const threshold = this.config.threshold.failureRate;
    if (!threshold) return;

    const recentMetrics = this.getRecentMetrics(24); // Last 24 hours
    if (recentMetrics.length === 0) return;

    const failedTests = recentMetrics.filter(m => m.status === 'failed').length;
    const failureRate = (failedTests / recentMetrics.length) * 100;

    if (failureRate > threshold) {
      this.createAlert({
        type: 'failure_rate',
        severity: failureRate > threshold * 2 ? 'critical' : 'high',
        message: `Test failure rate (${failureRate.toFixed(1)}%) exceeds threshold (${threshold}%)`,
        data: {
          failureRate,
          threshold,
          failedTests,
          totalTests: recentMetrics.length,
          recentFailures: recentMetrics.filter(m => m.status === 'failed').map(m => m.testName),
        },
      });
    }
  }

  // Check performance threshold
  private checkPerformance() {
    const threshold = this.config.threshold.duration;
    if (!threshold) return;

    const recentMetrics = this.getRecentMetrics(24);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;

    if (avgDuration > threshold) {
      this.createAlert({
        type: 'performance',
        severity: avgDuration > threshold * 2 ? 'high' : 'medium',
        message: `Average test duration (${avgDuration.toFixed(0)}ms) exceeds threshold (${threshold}ms)`,
        data: {
          avgDuration,
          threshold,
          slowTests: recentMetrics
            .filter(m => m.duration > threshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
            .map(m => ({ name: m.testName, duration: m.duration })),
        },
      });
    }
  }

  // Check for flaky tests
  private checkFlakyTests() {
    const threshold = this.config.threshold.flakyTests;
    if (!threshold) return;

    const flakyTests = this.detectFlakyTests();
    
    if (flakyTests.length > threshold) {
      this.createAlert({
        type: 'flaky_test',
        severity: flakyTests.length > threshold * 2 ? 'high' : 'medium',
        message: `${flakyTests.length} flaky tests detected (threshold: ${threshold})`,
        data: {
          flakyTests: flakyTests.map(t => ({
            name: t.testName,
            successRate: t.successRate,
            retries: t.totalRetries,
          })),
          threshold,
        },
      });
    }
  }

  // Check test coverage
  private checkCoverage() {
    const threshold = this.config.threshold.coverage;
    if (!threshold || this.suiteMetrics.length === 0) return;

    const latestSuite = this.suiteMetrics[this.suiteMetrics.length - 1];
    
    if (latestSuite.coverage < threshold) {
      this.createAlert({
        type: 'coverage',
        severity: latestSuite.coverage < threshold * 0.7 ? 'high' : 'medium',
        message: `Test coverage (${latestSuite.coverage}%) is below threshold (${threshold}%)`,
        data: {
          coverage: latestSuite.coverage,
          threshold,
          suiteName: latestSuite.suiteName,
        },
      });
    }
  }

  // Create new alert
  private createAlert(alert: Omit<TestAlert, 'id' | 'timestamp' | 'resolved'>) {
    const newAlert: TestAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(newAlert);
    this.sendAlert(newAlert);
  }

  // Send alert based on configuration
  private async sendAlert(alert: TestAlert) {
    try {
      switch (this.config.type) {
        case 'slack':
          await this.sendSlackAlert(alert);
          break;
        case 'email':
          await this.sendEmailAlert(alert);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert);
          break;
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Send Slack alert
  private async sendSlackAlert(alert: TestAlert) {
    if (!this.config.webhookUrl) return;

    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff4444',
      critical: '#cc0000',
    }[alert.severity];

    const payload = {
      attachments: [{
        color,
        title: `🚨 Test Alert - ${alert.type.replace('_', ' ')}`,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true,
          },
        ],
        footer: 'SABO Pool Arena Testing System',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
      }],
    };

    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // Send email alert (placeholder - would integrate with email service)
  private async sendEmailAlert(alert: TestAlert) {
    console.log('Email alert would be sent:', alert);
    // Implementation would depend on email service (SendGrid, AWS SES, etc.)
  }

  // Send webhook alert
  private async sendWebhookAlert(alert: TestAlert) {
    if (!this.config.webhookUrl) return;

    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_alert',
        alert,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Get recent metrics within specified hours
  private getRecentMetrics(hours: number): TestMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  // Detect flaky tests
  private detectFlakyTests() {
    const testStats = new Map<string, { total: number; passed: number; retries: number }>();

    this.metrics.forEach(metric => {
      if (!testStats.has(metric.testName)) {
        testStats.set(metric.testName, { total: 0, passed: 0, retries: 0 });
      }
      
      const stats = testStats.get(metric.testName)!;
      stats.total++;
      if (metric.status === 'passed') stats.passed++;
      stats.retries += metric.retryCount || 0;
    });

    const flakyTests: Array<{
      testName: string;
      successRate: number;
      totalRetries: number;
    }> = [];

    testStats.forEach((stats, testName) => {
      const successRate = (stats.passed / stats.total) * 100;
      if (successRate < 95 && successRate > 0 && stats.total > 5) {
        flakyTests.push({
          testName,
          successRate,
          totalRetries: stats.retries,
        });
      }
    });

    return flakyTests;
  }

  // Generate monitoring dashboard data
  generateDashboard(): MonitoringDashboard {
    const recentMetrics = this.getRecentMetrics(168); // Last week
    const groupedByDay = this.groupMetricsByDay(recentMetrics);

    const testTrends = {
      passRate: [],
      avgDuration: [],
      coverage: [],
      timestamps: [],
    } as MonitoringDashboard['testTrends'];

    groupedByDay.forEach((dayMetrics, day) => {
      const passed = dayMetrics.filter(m => m.status === 'passed').length;
      const passRate = (passed / dayMetrics.length) * 100;
      const avgDuration = dayMetrics.reduce((sum, m) => sum + m.duration, 0) / dayMetrics.length;

      testTrends.passRate.push(passRate);
      testTrends.avgDuration.push(avgDuration);
      testTrends.timestamps.push(day);
    });

    // Get coverage from suite metrics
    this.suiteMetrics.forEach(suite => {
      testTrends.coverage.push(suite.coverage);
    });

    const activeAlerts = this.alerts.filter(a => !a.resolved);
    const flakyTests = this.detectFlakyTests();

    return {
      testTrends,
      alerts: activeAlerts,
      metrics: {
        totalTests: recentMetrics.length,
        passRate: recentMetrics.length > 0 
          ? (recentMetrics.filter(m => m.status === 'passed').length / recentMetrics.length) * 100 
          : 0,
        avgDuration: recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
          : 0,
        coverage: this.suiteMetrics.length > 0 
          ? this.suiteMetrics[this.suiteMetrics.length - 1].coverage 
          : 0,
        flakyTests: flakyTests.length,
      },
    };
  }

  // Group metrics by day
  private groupMetricsByDay(metrics: TestMetrics[]): Map<string, TestMetrics[]> {
    const grouped = new Map<string, TestMetrics[]>();

    metrics.forEach(metric => {
      const day = new Date(metric.timestamp).toISOString().split('T')[0];
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(metric);
    });

    return grouped;
  }

  // Resolve alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  // Get active alerts
  getActiveAlerts(): TestAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  // Clear old metrics and alerts
  cleanup(daysToKeep = 30) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff);
    this.alerts = this.alerts.filter(a => new Date(a.timestamp) > cutoff);
    this.suiteMetrics = this.suiteMetrics.filter(s => new Date(s.timestamp) > cutoff);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default monitoring configuration
export const defaultMonitoringConfig: AlertConfig = {
  type: 'slack',
  threshold: {
    failureRate: 10, // 10%
    duration: 30000, // 30 seconds
    flakyTests: 5,
    coverage: 80, // 80%
  },
  enabled: true,
};

// Global monitor instance
export const testMonitor = new TestMonitor(defaultMonitoringConfig);

// Utility function to initialize monitoring
export const initializeMonitoring = (config: Partial<AlertConfig> = {}) => {
  const finalConfig = { ...defaultMonitoringConfig, ...config };
  return new TestMonitor(finalConfig);
};