import { TestReporter, TestResultParser } from './test-reporter';
import * as fs from 'fs';
import * as path from 'path';

export class CIIntegration {
  private reporter: TestReporter;
  private isCI: boolean;
  private ciProvider: string;

  constructor() {
    this.reporter = new TestReporter();
    this.isCI = process.env.CI === 'true';
    this.ciProvider = this.detectCIProvider();
  }

  /**
   * Detect CI provider
   */
  private detectCIProvider(): string {
    if (process.env.GITHUB_ACTIONS) return 'github';
    if (process.env.GITLAB_CI) return 'gitlab';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.TRAVIS) return 'travis';
    if (process.env.CIRCLECI) return 'circle';
    return 'unknown';
  }

  /**
   * Collect and process all test results
   */
  async collectTestResults(): Promise<void> {
    const resultFiles = [
      { type: 'vitest', pattern: 'coverage/vitest-results.json' },
      { type: 'playwright', pattern: 'playwright-report/results.json' },
      { type: 'junit', pattern: 'test-results/junit.xml' }
    ];

    for (const { type, pattern } of resultFiles) {
      try {
        if (fs.existsSync(pattern)) {
          console.log(`Processing ${type} results from ${pattern}`);
          await this.processResultFile(type, pattern);
        }
      } catch (error) {
        console.warn(`Failed to process ${type} results:`, error);
      }
    }
  }

  /**
   * Process individual result file
   */
  private async processResultFile(type: string, filePath: string): Promise<void> {
    let results;

    switch (type) {
      case 'vitest':
        results = TestResultParser.parseVitestResults(filePath);
        break;
      case 'playwright':
        results = TestResultParser.parsePlaywrightResults(filePath);
        break;
      default:
        console.warn(`Unknown result type: ${type}`);
        return;
    }

    results.forEach(result => {
      this.reporter.addSuiteResult(result);
    });
  }

  /**
   * Generate all reports
   */
  async generateReports(): Promise<{
    json: string;
    html: string;
    junit: string;
  }> {
    return {
      json: this.reporter.generateJsonReport(),
      html: this.reporter.generateHtmlReport(),
      junit: this.reporter.generateJunitReport()
    };
  }

  /**
   * Set CI outputs
   */
  async setCIOutputs(): Promise<void> {
    if (!this.isCI) return;

    const summary = this.reporter.getCiSummary();

    switch (this.ciProvider) {
      case 'github':
        await this.setGitHubOutputs(summary);
        break;
      case 'gitlab':
        await this.setGitLabOutputs(summary);
        break;
      default:
        console.log('CI outputs not implemented for:', this.ciProvider);
    }
  }

  /**
   * Set GitHub Actions outputs
   */
  private async setGitHubOutputs(summary: string): Promise<void> {
    // Set step summary
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      fs.appendFileSync(summaryFile, summary);
    }

    // Set outputs
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      const outputs = this.generateCIOutputs();
      Object.entries(outputs).forEach(([key, value]) => {
        fs.appendFileSync(outputFile, `${key}=${value}\n`);
      });
    }

    // Create annotations for failures
    await this.createGitHubAnnotations();
  }

  /**
   * Set GitLab CI outputs
   */
  private async setGitLabOutputs(summary: string): Promise<void> {
    // GitLab CI doesn't have direct equivalents to GitHub Actions outputs
    // but we can use job artifacts and reports
    console.log('GitLab CI Summary:', summary);

    // Create GitLab-compatible test report
    const gitlabReport = this.generateGitLabTestReport();
    fs.writeFileSync('gitlab-test-report.xml', gitlabReport);
  }

  /**
   * Generate CI outputs
   */
  private generateCIOutputs(): Record<string, any> {
    const summary = this.reporter['generateSummary']();
    
    return {
      total_tests: summary.totalTests,
      passed_tests: summary.totalPassed,
      failed_tests: summary.totalFailed,
      skipped_tests: summary.totalSkipped,
      pass_rate: summary.passRate.toFixed(1),
      duration: (summary.totalDuration / 1000).toFixed(1),
      status: summary.totalFailed > 0 ? 'failed' : 'passed'
    };
  }

  /**
   * Create GitHub annotations for failures
   */
  private async createGitHubAnnotations(): Promise<void> {
    const results = this.reporter['results'];
    
    results.forEach(suite => {
      suite.tests.forEach(test => {
        if (test.status === 'failed') {
          console.log(`::error::Test failed: ${suite.name} > ${test.test}${test.error ? ` - ${test.error}` : ''}`);
        }
      });
    });
  }

  /**
   * Generate GitLab test report
   */
  private generateGitLabTestReport(): string {
    return this.reporter.generateJunitReport();
  }

  /**
   * Send notifications
   */
  async sendNotifications(): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    
    if (webhookUrl) {
      await this.reporter.sendWebhookNotification(webhookUrl);
    }

    // Send email notifications for critical failures
    if (this.shouldSendCriticalNotification()) {
      await this.sendCriticalNotification();
    }
  }

  /**
   * Check if critical notification should be sent
   */
  private shouldSendCriticalNotification(): boolean {
    const summary = this.reporter['generateSummary']();
    const failureRate = (summary.totalFailed / summary.totalTests) * 100;
    
    // Send critical notification if more than 50% of tests fail
    return failureRate > 50;
  }

  /**
   * Send critical notification
   */
  private async sendCriticalNotification(): Promise<void> {
    console.log('🚨 CRITICAL: High test failure rate detected!');
    
    // This would integrate with your notification service
    // For example: email, PagerDuty, etc.
  }

  /**
   * Archive test results
   */
  async archiveResults(): Promise<void> {
    const archiveDir = path.join('test-archives', new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Copy reports to archive
    const reports = await this.generateReports();
    
    Object.entries(reports).forEach(([type, filePath]) => {
      if (fs.existsSync(filePath)) {
        const fileName = `${Date.now()}-${type}-report.${type === 'junit' ? 'xml' : type}`;
        fs.copyFileSync(filePath, path.join(archiveDir, fileName));
      }
    });

    console.log(`Test results archived to: ${archiveDir}`);
  }

  /**
   * Main execution function for CI
   */
  async run(): Promise<void> {
    console.log('🧪 Starting CI test integration...');
    
    try {
      // Collect all test results
      await this.collectTestResults();
      
      // Generate reports
      const reports = await this.generateReports();
      console.log('📊 Generated reports:', reports);
      
      // Set CI outputs
      await this.setCIOutputs();
      
      // Send notifications
      await this.sendNotifications();
      
      // Archive results
      await this.archiveResults();
      
      console.log('✅ CI test integration completed successfully');
      
    } catch (error) {
      console.error('❌ CI test integration failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Utility functions for CI environments
 */
export class CIUtils {
  /**
   * Check if running in CI
   */
  static isCI(): boolean {
    return process.env.CI === 'true';
  }

  /**
   * Get CI provider
   */
  static getCIProvider(): string {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.GITLAB_CI) return 'gitlab-ci';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.TRAVIS) return 'travis-ci';
    if (process.env.CIRCLECI) return 'circleci';
    return 'unknown';
  }

  /**
   * Get branch name
   */
  static getBranch(): string {
    return process.env.GITHUB_HEAD_REF || 
           process.env.GITHUB_REF_NAME || 
           process.env.CI_COMMIT_REF_NAME || 
           process.env.BRANCH_NAME || 
           'unknown';
  }

  /**
   * Get commit SHA
   */
  static getCommitSHA(): string {
    return process.env.GITHUB_SHA || 
           process.env.CI_COMMIT_SHA || 
           process.env.GIT_COMMIT || 
           'unknown';
  }

  /**
   * Get PR number
   */
  static getPRNumber(): string | null {
    return process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER || 
           process.env.CI_MERGE_REQUEST_IID || 
           null;
  }

  /**
   * Create status check for GitHub
   */
  static async createGitHubStatusCheck(
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    context: string = 'tests'
  ): Promise<void> {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY) {
      return;
    }

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    const sha = CIUtils.getCommitSHA();

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state,
          description,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      console.log(`GitHub status check created: ${state} - ${description}`);
    } catch (error) {
      console.error('Failed to create GitHub status check:', error);
    }
  }
}

// CLI usage
if (require.main === module) {
  const integration = new CIIntegration();
  integration.run().catch(console.error);
}