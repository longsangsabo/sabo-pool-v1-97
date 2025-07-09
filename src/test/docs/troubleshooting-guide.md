# 🔧 Testing Troubleshooting Guide

Hướng dẫn giải quyết các vấn đề thường gặp khi testing Tournament Management System.

## 📋 Mục lục

1. [Flaky Tests](#flaky-tests)
2. [Performance Issues](#performance-issues)
3. [CI/CD Problems](#cicd-problems)
4. [Database Issues](#database-issues)
5. [Browser Compatibility](#browser-compatibility)
6. [Memory Leaks](#memory-leaks)
7. [Timeout Issues](#timeout-issues)
8. [Mock Problems](#mock-problems)
9. [Visual Regression](#visual-regression)
10. [Debug Techniques](#debug-techniques)

## 🎲 Flaky Tests

### Vấn đề: Tests thỉnh thoảng fail

#### Nguyên nhân phổ biến:
```typescript
// ❌ Race condition
test('loads tournament list', () => {
  render(<TournamentList />);
  expect(screen.getByText('Tournament A')).toBeInTheDocument();
});

// ❌ Timing dependency
test('animation completes', async () => {
  fireEvent.click(button);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Cố định 1s
  expect(modal).toBeVisible();
});

// ❌ Order dependency
let tournamentId: string;
test('creates tournament', () => {
  const result = createTournament(data);
  tournamentId = result.id; // Global state
});
test('updates tournament', () => {
  updateTournament(tournamentId, newData); // Phụ thuộc test trước
});
```

#### Giải pháp:
```typescript
// ✅ Wait for async operations
test('loads tournament list', async () => {
  render(<TournamentList />);
  await waitFor(() => {
    expect(screen.getByText('Tournament A')).toBeInTheDocument();
  });
});

// ✅ Wait for condition
test('animation completes', async () => {
  fireEvent.click(button);
  await waitFor(() => {
    expect(modal).toHaveClass('visible');
  }, { timeout: 5000 });
});

// ✅ Independent tests
test('creates tournament', () => {
  const result = createTournament(data);
  expect(result.id).toBeDefined();
});

test('updates tournament', () => {
  // Setup own data
  const tournament = createTournament(data);
  const result = updateTournament(tournament.id, newData);
  expect(result.name).toBe(newData.name);
});
```

#### Debug flaky tests:
```bash
# Chạy test nhiều lần để phát hiện flakiness
npm run test -- --reporter=verbose tournament.test.ts --repeat=10

# Sử dụng test stability monitor
npm run test:stability

# Check flaky test report
cat test-results/flaky-tests.json
```

## ⚡ Performance Issues

### Vấn đề: Tests chạy chậm

#### Nguyên nhân:
```typescript
// ❌ Không optimize setup
beforeEach(async () => {
  await setupCompleteDatabase(); // Expensive setup mỗi test
  await seedLargeDataset(); // Large data every time
});

// ❌ Không cleanup
test('creates many tournaments', () => {
  for (let i = 0; i < 1000; i++) {
    createTournament(data); // Creates 1000 records
  }
  // Không cleanup
});
```

#### Giải pháp:
```typescript
// ✅ Optimize setup/teardown
beforeAll(async () => {
  await setupDatabase(); // One-time setup
});

beforeEach(() => {
  resetTestState(); // Quick reset only
});

afterEach(() => {
  cleanupTestData(); // Clean only test data
});

afterAll(async () => {
  await teardownDatabase(); // One-time cleanup
});

// ✅ Use factories efficiently
test('creates tournaments', () => {
  const tournaments = createMockTournaments(5); // Mock data, not real DB
  expect(tournaments).toHaveLength(5);
});

// ✅ Parallel test execution
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2,
      },
    },
  },
});
```

#### Monitor performance:
```typescript
// Performance tracking
import { measureExecutionTime } from '@/test/utils/test-metrics';

test('performance test', async () => {
  const { result, duration } = await measureExecutionTime(async () => {
    return await performExpensiveOperation();
  }, 'Expensive Operation');

  expect(duration).toBeLessThan(1000); // 1 second
});
```

## 🚀 CI/CD Problems

### Vấn đề: Tests pass locally but fail in CI

#### Debugging steps:
```bash
# 1. Check CI environment
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Browser versions:"
npx playwright --version

# 2. Run tests with CI flags locally
CI=true npm run test
npm run test:ci

# 3. Enable verbose logging
DEBUG=pw:api npm run test:e2e
npm run test -- --reporter=verbose

# 4. Check for race conditions
npm run test -- --reporter=verbose --repeat=5
```

#### Common CI fixes:
```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci # Use ci instead of install

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests with retry
  run: npm run test:e2e -- --retries=2

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

#### Environment variables:
```typescript
// Handle different environments
const isCI = process.env.CI === 'true';
const timeout = isCI ? 30000 : 10000;

test('loads data', async () => {
  await page.goto('/tournaments', { timeout });
  // Test logic
}, timeout);
```

## 🗄️ Database Issues

### Vấn đề: Database state pollution

#### Nguyên nhân:
```typescript
// ❌ Shared database state
test('creates tournament', () => {
  const tournament = createTournamentInDB(data);
  expect(tournament.id).toBeDefined();
  // Không cleanup
});

test('lists tournaments', () => {
  const tournaments = getTournaments();
  expect(tournaments).toHaveLength(1); // Fails because of previous test
});
```

#### Giải pháp:
```typescript
// ✅ Proper database isolation
beforeEach(async () => {
  await cleanupTestDatabase();
  await seedBaseData();
});

afterEach(async () => {
  await cleanupTestDatabase();
});

// ✅ Use transactions for rollback
test('database transaction test', async () => {
  const transaction = await db.transaction();
  
  try {
    // Test logic with transaction
    const result = await transaction.tournaments.create(data);
    expect(result.id).toBeDefined();
    
    // Rollback automatically in test
    await transaction.rollback();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// ✅ Use test-specific data
test('tournament creation', async () => {
  const uniqueData = {
    ...baseData,
    name: `Test Tournament ${Date.now()}` // Unique identifier
  };
  
  const result = await createTournament(uniqueData);
  expect(result.name).toBe(uniqueData.name);
});
```

### Database connection issues:
```typescript
// Check database connection
beforeAll(async () => {
  try {
    await supabase.from('profiles').select('id').limit(1);
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
});
```

## 🌐 Browser Compatibility

### Vấn đề: Tests fail on specific browsers

#### Debug browser-specific issues:
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

// Browser-specific test
test.describe('Cross-browser testing', () => {
  test('tournament creation @cross-browser', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);
    
    // Browser-specific logic
    if (browserName === 'webkit') {
      await page.waitForTimeout(1000); // Safari needs extra time
    }
    
    await page.goto('/tournaments');
    // Test logic
  });
});
```

#### Handle browser differences:
```typescript
// Utility for browser detection
export const getBrowserInfo = async (page: Page) => {
  return await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform,
  }));
};

// Conditional test logic
test('feature with browser fallback', async ({ page }) => {
  const browser = await getBrowserInfo(page);
  
  if (browser.userAgent.includes('Safari')) {
    // Safari-specific implementation
    await page.click('[data-testid="safari-button"]');
  } else {
    // Standard implementation
    await page.click('[data-testid="standard-button"]');
  }
});
```

## 🧠 Memory Leaks

### Vấn đề: Memory usage increases over time

#### Detect memory leaks:
```typescript
test('memory leak detection', async ({ page }) => {
  // Get initial memory
  const getMemory = () => page.evaluate(() => 
    (performance as any).memory?.usedJSHeapSize || 0
  );
  
  const initialMemory = await getMemory();
  
  // Perform operations
  for (let i = 0; i < 10; i++) {
    await page.goto('/tournaments');
    await page.click('[data-testid="create-btn"]');
    await page.click('[data-testid="cancel-btn"]');
  }
  
  // Check memory after operations
  const finalMemory = await getMemory();
  const memoryIncrease = finalMemory - initialMemory;
  
  // Assert memory doesn't increase significantly
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
  
  console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
});
```

#### Common leak sources:
```typescript
// ❌ Event listeners not cleaned up
useEffect(() => {
  const handler = () => { /* logic */ };
  window.addEventListener('resize', handler);
  // Missing cleanup
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const handler = () => { /* logic */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);

// ❌ Timers not cleared
useEffect(() => {
  const interval = setInterval(() => {
    // Logic
  }, 1000);
  // Missing cleanup
}, []);

// ✅ Clear timers
useEffect(() => {
  const interval = setInterval(() => {
    // Logic
  }, 1000);
  
  return () => {
    clearInterval(interval);
  };
}, []);
```

## ⏰ Timeout Issues

### Vấn đề: Tests timeout unexpectedly

#### Common timeout problems:
```typescript
// ❌ Fixed short timeout
test('loads data', async () => {
  await page.goto('/tournaments');
  await page.waitForSelector('[data-testid="list"]', { timeout: 1000 }); // Too short
});

// ❌ Waiting for wrong element
await page.waitForSelector('[data-testid="loading"]'); // Waits for loading, not content
```

#### Solutions:
```typescript
// ✅ Appropriate timeouts
test('loads data', async () => {
  await page.goto('/tournaments');
  
  // Wait for loading to disappear
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
  
  // Wait for content to appear
  await page.waitForSelector('[data-testid="tournament-list"]', { 
    timeout: 10000 
  });
});

// ✅ Multiple wait strategies
test('complex interaction', async () => {
  await page.goto('/tournaments');
  
  // Strategy 1: Wait for network
  await page.waitForLoadState('networkidle');
  
  // Strategy 2: Wait for specific element
  await page.waitForSelector('[data-testid="ready"]');
  
  // Strategy 3: Wait for function
  await page.waitForFunction(() => 
    document.querySelectorAll('[data-testid^="tournament-"]').length > 0
  );
});

// ✅ Configurable timeouts
const TIMEOUT = process.env.CI ? 30000 : 10000;

test('respects environment timeout', async () => {
  await page.goto('/tournaments', { timeout: TIMEOUT });
}, TIMEOUT);
```

## 🎭 Mock Problems

### Vấn đề: Mocks not working correctly

#### Common mock issues:
```typescript
// ❌ Mock không reset
vi.mock('@/services/api');
test('first test', () => {
  mockApi.get.mockResolvedValue(data1);
  // Test logic
});

test('second test', () => {
  // mockApi.get still returns data1 from previous test
  mockApi.get.mockResolvedValue(data2);
});
```

#### Solutions:
```typescript
// ✅ Proper mock cleanup
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history
  vi.resetAllMocks(); // Reset implementation
});

// ✅ Mock per test
test('api success', () => {
  const mockResponse = { data: 'success' };
  vi.mocked(api.get).mockResolvedValueOnce(mockResponse);
  
  // Test logic
});

test('api error', () => {
  const mockError = new Error('API Error');
  vi.mocked(api.get).mockRejectedValueOnce(mockError);
  
  // Test logic
});

// ✅ Verify mock calls
test('calls API with correct params', () => {
  service.getTournament('123');
  
  expect(api.get).toHaveBeenCalledWith('/tournaments/123');
  expect(api.get).toHaveBeenCalledTimes(1);
});
```

### Supabase mock issues:
```typescript
// ✅ Proper Supabase mocking
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    }))
  }
}));
```

## 👁️ Visual Regression

### Vấn đề: Screenshots không consistent

#### Common causes:
```typescript
// ❌ Dynamic content not hidden
await expect(page).toHaveScreenshot('tournament-page.png');
// Timestamps, animations cause differences

// ❌ Font loading race condition
await page.goto('/tournaments');
await expect(page).toHaveScreenshot(); // Fonts might not be loaded
```

#### Solutions:
```typescript
// ✅ Hide dynamic content
test('visual regression', async ({ page }) => {
  await page.goto('/tournaments');
  
  // Hide dynamic elements
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"] { visibility: hidden !important; }
      .loading-spinner { display: none !important; }
      .animation { animation-duration: 0s !important; }
    `
  });
  
  // Wait for fonts
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.fonts.ready);
  
  await expect(page).toHaveScreenshot('tournament-page.png');
});

// ✅ Consistent viewport
test.use({ 
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1 
});

// ✅ Update screenshots when needed
// npm run test:visual -- --update-snapshots
```

## 🕵️ Debug Techniques

### General debugging:
```typescript
// Debug test output
test('debug example', async () => {
  render(<TournamentList />);
  
  // Print DOM structure
  screen.debug();
  
  // Query debugging
  console.log(screen.getByRole('button', { name: /create/i }));
  
  // State debugging
  const tournaments = screen.getAllByTestId(/tournament-/);
  console.log('Found tournaments:', tournaments.length);
});
```

### Playwright debugging:
```bash
# Interactive debugging
npm run test:e2e -- --debug

# Headed mode
npm run test:e2e -- --headed

# Slow motion
npm run test:e2e -- --slow-mo=1000

# Trace on retry
npm run test:e2e -- --trace on-first-retry
```

```typescript
// Programmatic debugging
test('debug playwright', async ({ page }) => {
  await page.goto('/tournaments');
  
  // Pause for manual inspection
  await page.pause();
  
  // Take screenshot
  await page.screenshot({ path: 'debug.png' });
  
  // Console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Network monitoring
  page.on('request', request => 
    console.log('REQUEST:', request.url())
  );
  
  page.on('response', response => 
    console.log('RESPONSE:', response.status(), response.url())
  );
});
```

### CI debugging:
```yaml
# .github/workflows/debug.yml
- name: Debug test failure
  if: failure()
  run: |
    echo "Test failed, gathering debug info..."
    ls -la test-results/
    cat test-results/results.json
    
- name: Upload debug artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: debug-artifacts
    path: |
      test-results/
      screenshots/
      videos/
```

## 🔧 Quick Fixes Checklist

Khi gặp vấn đề test, hãy kiểm tra theo thứ tự:

1. **Basic checks:**
   - [ ] Tests chạy được locally?
   - [ ] Dependencies cài đúng chưa?
   - [ ] Environment variables đúng chưa?

2. **Flaky tests:**
   - [ ] Có race conditions không?
   - [ ] Tests phụ thuộc lẫn nhau?
   - [ ] Cleanup đầy đủ chưa?

3. **Performance:**
   - [ ] Setup/teardown quá expensive?
   - [ ] Tests chạy parallel được không?
   - [ ] Memory leaks?

4. **CI/CD:**
   - [ ] Environment khác local?
   - [ ] Timeout phù hợp?
   - [ ] Browser compatibility?

5. **Mocks:**
   - [ ] Mock reset đúng?
   - [ ] Implementation chính xác?
   - [ ] Verification đúng?

## 📞 Khi nào cần help?

Liên hệ team khi:
- Flaky test rate > 5%
- Test duration tăng > 50%
- CI fail rate > 10%
- Memory usage tăng liên tục
- New browser compatibility issues

---

**Remember**: Debugging tests is a skill. Take systematic approach, use tools available, and don't hesitate to ask for help! 🚀