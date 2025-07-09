import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface TestSuiteResult {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: string;
}

export class TestReporter {
  private results: TestSuiteResult[] = [];
  private outputDir: string;

  constructor(outputDir: string = 'test-reports') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Add test suite results
   */
  addSuiteResult(suiteResult: TestSuiteResult) {
    this.results.push(suiteResult);
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      suites: this.results
    };

    const reportPath = path.join(this.outputDir, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(): string {
    const summary = this.generateSummary();
    const html = this.generateHtmlContent(summary);
    
    const reportPath = path.join(this.outputDir, 'test-report.html');
    fs.writeFileSync(reportPath, html);
    
    return reportPath;
  }

  /**
   * Generate JUnit XML report
   */
  generateJunitReport(): string {
    const xml = this.generateJunitXml();
    
    const reportPath = path.join(this.outputDir, 'junit-results.xml');
    fs.writeFileSync(reportPath, xml);
    
    return reportPath;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    const totalSkipped = this.results.reduce((sum, suite) => sum + suite.skipped, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.duration, 0);
    
    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      totalDuration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate HTML content for report
   */
  private generateHtmlContent(summary: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007acc; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; font-size: 14px; }
        .suite { margin-bottom: 30px; }
        .suite-header { background: #e9e9e9; padding: 15px; border-radius: 8px 8px 0 0; font-weight: bold; }
        .test-list { border: 1px solid #ddd; border-top: none; }
        .test-item { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-skipped { background: #fff3cd; color: #856404; }
        .error { color: #dc3545; font-size: 12px; margin-top: 5px; }
        .duration { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${summary.totalTests}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #28a745">${summary.totalPassed}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #dc3545">${summary.totalFailed}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #ffc107">${summary.totalSkipped}</div>
            <div class="metric-label">Skipped</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.passRate.toFixed(1)}%</div>
            <div class="metric-label">Pass Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(summary.totalDuration / 1000).toFixed(1)}s</div>
            <div class="metric-label">Duration</div>
        </div>
    </div>
    
    ${this.results.map(suite => `
        <div class="suite">
            <div class="suite-header">
                📂 ${suite.name} 
                <span style="float: right; font-size: 14px; font-weight: normal;">
                    ${suite.passed}/${suite.totalTests} passed (${((suite.passed / suite.totalTests) * 100).toFixed(1)}%)
                </span>
            </div>
            <div class="test-list">
                ${suite.tests.map(test => `
                    <div class="test-item">
                        <div>
                            <div>${test.test}</div>
                            ${test.error ? `<div class="error">${test.error}</div>` : ''}
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span class="duration">${test.duration}ms</span>
                            <span class="status status-${test.status}">${test.status.toUpperCase()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate JUnit XML format
   */
  private generateJunitXml(): string {
    const summary = this.generateSummary();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites tests="${summary.totalTests}" failures="${summary.totalFailed}" skipped="${summary.totalSkipped}" time="${summary.totalDuration / 1000}">\n`;
    
    this.results.forEach(suite => {
      xml += `  <testsuite name="${suite.name}" tests="${suite.totalTests}" failures="${suite.failed}" skipped="${suite.skipped}" time="${suite.duration / 1000}">\n`;
      
      suite.tests.forEach(test => {
        xml += `    <testcase name="${test.test}" classname="${suite.name}" time="${test.duration / 1000}">`;
        
        if (test.status === 'failed') {
          xml += `\n      <failure message="${test.error || 'Test failed'}">${test.error || 'Test failed'}</failure>\n    `;
        } else if (test.status === 'skipped') {
          xml += `\n      <skipped/>\n    `;
        }
        
        xml += `</testcase>\n`;
      });
      
      xml += `  </testsuite>\n`;
    });
    
    xml += `</testsuites>`;
    
    return xml;
  }

  /**
   * Generate Slack notification message
   */
  generateSlackMessage(): object {
    const summary = this.generateSummary();
    const status = summary.totalFailed > 0 ? 'failed' : 'passed';
    const color = status === 'passed' ? 'good' : 'danger';
    
    return {
      attachments: [
        {
          color: color,
          title: `🧪 Test Results - ${status.toUpperCase()}`,
          fields: [
            {
              title: 'Total Tests',
              value: summary.totalTests.toString(),
              short: true
            },
            {
              title: 'Passed',
              value: summary.totalPassed.toString(),
              short: true
            },
            {
              title: 'Failed',
              value: summary.totalFailed.toString(),
              short: true
            },
            {
              title: 'Pass Rate',
              value: `${summary.passRate.toFixed(1)}%`,
              short: true
            },
            {
              title: 'Duration',
              value: `${(summary.totalDuration / 1000).toFixed(1)}s`,
              short: true
            }
          ],
          footer: 'Test Reporter',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  /**
   * Send notification to webhook
   */
  async sendWebhookNotification(webhookUrl: string): Promise<void> {
    if (!webhookUrl) return;

    const message = this.generateSlackMessage();
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Webhook notification failed: ${response.statusText}`);
      }
      
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  /**
   * Get summary for CI/CD systems
   */
  getCiSummary(): string {
    const summary = this.generateSummary();
    
    return `
## 🧪 Test Results Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${summary.totalTests} |
| **Passed** | ✅ ${summary.totalPassed} |
| **Failed** | ❌ ${summary.totalFailed} |
| **Skipped** | ⏭️ ${summary.totalSkipped} |
| **Pass Rate** | ${summary.passRate.toFixed(1)}% |
| **Duration** | ${(summary.totalDuration / 1000).toFixed(1)}s |

### Test Suites:
${this.results.map(suite => 
  `- **${suite.name}**: ${suite.passed}/${suite.totalTests} passed (${((suite.passed / suite.totalTests) * 100).toFixed(1)}%)`
).join('\n')}
`;
  }
}

/**
 * Utility function to parse test results from various formats
 */
export class TestResultParser {
  /**
   * Parse Vitest results
   */
  static parseVitestResults(resultFile: string): TestSuiteResult[] {
    try {
      const content = fs.readFileSync(resultFile, 'utf8');
      const data = JSON.parse(content);
      
      // Transform Vitest format to our format
      return data.testResults?.map((suite: any) => ({
        name: suite.name,
        tests: suite.assertionResults?.map((test: any) => ({
          suite: suite.name,
          test: test.title,
          status: test.status,
          duration: test.duration || 0,
          error: test.failureMessages?.join('\n')
        })) || [],
        totalTests: suite.numTests || 0,
        passed: suite.numPassingTests || 0,
        failed: suite.numFailingTests || 0,
        skipped: suite.numPendingTests || 0,
        duration: suite.perfStats?.end - suite.perfStats?.start || 0,
        timestamp: new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Failed to parse Vitest results:', error);
      return [];
    }
  }

  /**
   * Parse Playwright results
   */
  static parsePlaywrightResults(resultFile: string): TestSuiteResult[] {
    try {
      const content = fs.readFileSync(resultFile, 'utf8');
      const data = JSON.parse(content);
      
      // Transform Playwright format to our format
      const suites: { [key: string]: TestResult[] } = {};
      
      data.suites?.forEach((suite: any) => {
        const suiteName = suite.title || 'Unknown Suite';
        if (!suites[suiteName]) {
          suites[suiteName] = [];
        }
        
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            suites[suiteName].push({
              suite: suiteName,
              test: test.title,
              status: test.outcome === 'expected' ? 'passed' : 'failed',
              duration: test.results?.[0]?.duration || 0,
              error: test.results?.[0]?.error?.message
            });
          });
        });
      });
      
      return Object.entries(suites).map(([name, tests]) => ({
        name,
        tests,
        totalTests: tests.length,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        skipped: tests.filter(t => t.status === 'skipped').length,
        duration: tests.reduce((sum, t) => sum + t.duration, 0),
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to parse Playwright results:', error);
      return [];
    }
  }
}