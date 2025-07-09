# 🧪 Testing Best Practices Guide

Hướng dẫn chi tiết về các best practices khi viết và duy trì tests cho Tournament Management System.

## 📋 Mục lục

1. [Nguyên tắc cơ bản](#nguyên-tắc-cơ-bản)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Performance Testing](#performance-testing)
6. [Test Data Management](#test-data-management)
7. [Mocking Strategies](#mocking-strategies)
8. [Error Handling](#error-handling)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

## 🎯 Nguyên tắc cơ bản

### 1. Test Pyramid
```
    /\
   /  \    E2E Tests (Ít)
  /____\   
 /      \   Integration Tests (Vừa)
/__________\ Unit Tests (Nhiều)
```

### 2. AAA Pattern
```typescript
// ❌ BAD - Không rõ ràng
test('user creation', async () => {
  const userData = { name: 'John', email: 'john@test.com' };
  const result = await createUser(userData);
  expect(result.id).toBeDefined();
});

// ✅ GOOD - Rõ ràng và có cấu trúc
test('should create user with valid data', async () => {
  // Arrange
  const userData = {
    name: 'John Doe',
    email: 'john.doe@test.com',
    skillLevel: 'intermediate'
  };

  // Act
  const result = await createUser(userData);

  // Assert
  expect(result).toMatchObject({
    id: expect.any(String),
    name: userData.name,
    email: userData.email,
    createdAt: expect.any(String)
  });
});
```

### 3. Test Independence
```typescript
// ❌ BAD - Tests phụ thuộc lẫn nhau
let userId: string;

test('creates user', async () => {
  const user = await createUser(userData);
  userId = user.id; // Global state
});

test('updates user', async () => {
  await updateUser(userId, updateData); // Depends on previous test
});

// ✅ GOOD - Mỗi test độc lập
test('creates user', async () => {
  const user = await createUser(userData);
  expect(user.id).toBeDefined();
});

test('updates user', async () => {
  // Setup own data
  const user = await createUser(userData);
  const result = await updateUser(user.id, updateData);
  expect(result.name).toBe(updateData.name);
});
```

## 🔧 Unit Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentCard } from '../TournamentCard';
import { createMockTournament } from '@/test/factories';

describe('TournamentCard', () => {
  it('should display tournament information correctly', () => {
    // Arrange
    const tournament = createMockTournament({
      name: 'Summer Championship',
      entryFee: 100000,
      maxParticipants: 16
    });

    // Act
    render(<TournamentCard tournament={tournament} />);

    // Assert
    expect(screen.getByText('Summer Championship')).toBeInTheDocument();
    expect(screen.getByText('100,000 VND')).toBeInTheDocument();
    expect(screen.getByText('16 players max')).toBeInTheDocument();
  });

  it('should handle join tournament action', async () => {
    // Arrange
    const tournament = createMockTournament();
    const onJoin = vi.fn();
    
    render(<TournamentCard tournament={tournament} onJoin={onJoin} />);

    // Act
    fireEvent.click(screen.getByText('Join Tournament'));

    // Assert
    expect(onJoin).toHaveBeenCalledWith(tournament.id);
  });
});
```

### Service Testing
```typescript
import { TournamentService } from '../TournamentService';
import { createMockTournament } from '@/test/factories';
import { mockSupabase } from '@/test/mocks/supabase';

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(() => {
    service = new TournamentService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create tournament with valid data', async () => {
      // Arrange
      const tournamentData = createMockTournament();
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [tournamentData],
            error: null
          })
        })
      });

      // Act
      const result = await service.createTournament(tournamentData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(tournamentData);
      expect(mockSupabase.from).toHaveBeenCalledWith('tournaments');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const tournamentData = createMockTournament();
      const dbError = new Error('Database connection failed');
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: dbError
          })
        })
      });

      // Act
      const result = await service.createTournament(tournamentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});
```

## 🔗 Integration Testing

### API Integration
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from '@/test/utils/database';
import { TournamentAPI } from '../api/tournament';

describe('Tournament API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create and retrieve tournament', async () => {
    // Arrange
    const tournamentData = {
      name: 'Integration Test Tournament',
      startDate: '2024-12-01',
      maxParticipants: 8
    };

    // Act
    const createResponse = await TournamentAPI.create(tournamentData);
    const getResponse = await TournamentAPI.getById(createResponse.id);

    // Assert
    expect(createResponse.id).toBeDefined();
    expect(getResponse.name).toBe(tournamentData.name);
    expect(getResponse.maxParticipants).toBe(8);
  });

  it('should handle tournament registration flow', async () => {
    // Arrange
    const tournament = await TournamentAPI.create(tournamentData);
    const user = await UserAPI.create(userData);

    // Act
    const registrationResult = await TournamentAPI.register(tournament.id, user.id);
    const updatedTournament = await TournamentAPI.getById(tournament.id);

    // Assert
    expect(registrationResult.success).toBe(true);
    expect(updatedTournament.currentParticipants).toBe(1);
  });
});
```

### Database Integration
```typescript
import { supabase } from '@/integrations/supabase/client';

describe('Database Operations', () => {
  it('should maintain data consistency across related tables', async () => {
    // Arrange
    const userData = createMockUser();
    const tournamentData = createMockTournament();

    // Act - Create user and tournament
    const { data: user } = await supabase
      .from('profiles')
      .insert(userData)
      .select()
      .single();

    const { data: tournament } = await supabase
      .from('tournaments')
      .insert({ ...tournamentData, created_by: user.id })
      .select()
      .single();

    // Act - Register user for tournament
    await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournament.id,
        user_id: user.id
      });

    // Assert - Check data consistency
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select(`
        *,
        tournament:tournaments(*),
        user:profiles(*)
      `)
      .eq('tournament_id', tournament.id);

    expect(registrations).toHaveLength(1);
    expect(registrations[0].tournament.name).toBe(tournament.name);
    expect(registrations[0].user.display_name).toBe(user.display_name);
  });
});
```

## 🎭 E2E Testing

### Page Object Pattern
```typescript
// pages/TournamentPage.ts
export class TournamentPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/tournaments');
  }

  async createTournament(tournamentData: any) {
    await this.page.click('[data-testid="create-tournament-btn"]');
    await this.page.fill('[data-testid="tournament-name"]', tournamentData.name);
    await this.page.fill('[data-testid="entry-fee"]', tournamentData.entryFee.toString());
    await this.page.click('[data-testid="submit-btn"]');
  }

  async joinTournament(tournamentName: string) {
    const tournamentCard = this.page.locator(`[data-testid="tournament-${tournamentName}"]`);
    await tournamentCard.locator('button:has-text("Join")').click();
  }

  async getTournamentList() {
    return this.page.locator('[data-testid^="tournament-"]').all();
  }
}

// tournament.spec.ts
import { test, expect } from '@playwright/test';
import { TournamentPage } from '../pages/TournamentPage';

test.describe('Tournament Management', () => {
  let tournamentPage: TournamentPage;

  test.beforeEach(async ({ page }) => {
    tournamentPage = new TournamentPage(page);
    await tournamentPage.goto();
  });

  test('should create and join tournament', async ({ page }) => {
    // Arrange
    const tournamentData = {
      name: 'E2E Test Tournament',
      entryFee: 50000,
      maxParticipants: 8
    };

    // Act
    await tournamentPage.createTournament(tournamentData);
    
    // Assert tournament created
    await expect(page.getByText(tournamentData.name)).toBeVisible();
    
    // Act - Join tournament
    await tournamentPage.joinTournament(tournamentData.name);
    
    // Assert - User joined
    await expect(page.getByText('Successfully joined')).toBeVisible();
  });
});
```

### Visual Testing
```typescript
test('tournament page visual regression', async ({ page }) => {
  await page.goto('/tournaments');
  await page.waitForLoadState('networkidle');
  
  // Hide dynamic elements
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"] { visibility: hidden; }
      .loading-spinner { display: none; }
    `
  });
  
  await expect(page).toHaveScreenshot('tournament-page.png');
});
```

## ⚡ Performance Testing

### Load Testing
```typescript
import { test, expect } from '@playwright/test';

test('tournament list performance', async ({ page }) => {
  // Start measuring
  const startTime = Date.now();
  
  await page.goto('/tournaments');
  
  // Wait for content to load
  await page.waitForSelector('[data-testid="tournament-list"]');
  
  const loadTime = Date.now() - startTime;
  
  // Assert performance threshold
  expect(loadTime).toBeLessThan(3000); // 3 seconds
  
  // Check Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries.map(entry => ({
          name: entry.name,
          value: entry.value
        })));
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    });
  });
  
  console.log('Performance metrics:', metrics);
});
```

### Memory Leak Testing
```typescript
test('memory usage monitoring', async ({ page }) => {
  await page.goto('/tournaments');
  
  // Get initial memory
  const initialMemory = await page.evaluate(() => 
    (performance as any).memory?.usedJSHeapSize || 0
  );
  
  // Perform actions that might leak memory
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="create-tournament-btn"]');
    await page.click('[data-testid="cancel-btn"]');
  }
  
  // Get final memory
  const finalMemory = await page.evaluate(() => 
    (performance as any).memory?.usedJSHeapSize || 0
  );
  
  const memoryIncrease = finalMemory - initialMemory;
  
  // Assert memory doesn't increase significantly
  expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB
});
```

## 🎯 Test Data Management

### Factory Pattern
```typescript
// Use factories from src/test/factories/
import { 
  createMockTournament, 
  createMockUser, 
  createTournamentWithParticipants 
} from '@/test/factories';

// ✅ GOOD - Using factories
test('tournament with participants', () => {
  const { tournament, participants } = createTournamentWithParticipants(8);
  expect(participants).toHaveLength(8);
  expect(tournament.maxParticipants).toBe(8);
});

// ✅ GOOD - Custom data with factory
test('premium tournament', () => {
  const tournament = createMockTournament({
    entryFee: 1000000,
    name: 'Premium Championship'
  });
  
  expect(tournament.entryFee).toBe(1000000);
});
```

### Database Seeding
```typescript
// test/utils/seed.ts
export async function seedTestData() {
  const users = createMockUsers(10);
  const tournaments = createMockTournaments(5);
  
  await Promise.all([
    supabase.from('profiles').insert(users),
    supabase.from('tournaments').insert(tournaments)
  ]);
  
  return { users, tournaments };
}

// In tests
beforeEach(async () => {
  await cleanupTestDatabase();
  await seedTestData();
});
```

## 🎭 Mocking Strategies

### Service Mocking
```typescript
// mocks/TournamentService.ts
export const mockTournamentService = {
  create: vi.fn(),
  getById: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// In tests
vi.mock('@/services/TournamentService', () => ({
  TournamentService: mockTournamentService
}));

test('tournament creation', () => {
  // Arrange
  mockTournamentService.create.mockResolvedValue({
    success: true,
    data: createMockTournament()
  });

  // Act & Assert
  // Test component that uses the service
});
```

### API Mocking
```typescript
// Mock API responses
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/api/tournaments', () => {
    return HttpResponse.json(createMockTournaments(5));
  }),

  http.post('/api/tournaments', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      createMockTournament(data),
      { status: 201 }
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 🚨 Error Handling

### Error Boundary Testing
```typescript
test('handles API errors gracefully', async () => {
  // Arrange - Mock API error
  mockTournamentService.list.mockRejectedValue(
    new Error('Network error')
  );

  // Act
  render(<TournamentList />);

  // Assert
  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

### Network Error Simulation
```typescript
test('handles network failures', async ({ page }) => {
  // Simulate offline
  await page.context().setOffline(true);
  
  await page.goto('/tournaments');
  
  // Assert offline message
  await expect(page.getByText('Connection lost')).toBeVisible();
  
  // Restore connection
  await page.context().setOffline(false);
  
  // Assert recovery
  await expect(page.getByText('Connection restored')).toBeVisible();
});
```

## 🔄 CI/CD Integration

### Test Parallelization
```yaml
# .github/workflows/test-parallel.yml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - name: Run tests
    run: npm run test -- --shard=${{ matrix.shard }}/4
```

### Conditional Testing
```typescript
// Skip expensive tests in development
test.skip(process.env.NODE_ENV === 'development', 'performance test', () => {
  // Expensive performance test
});

// Run only in CI
test.runIf(process.env.CI, 'CI specific test', () => {
  // CI-only test
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Flaky Tests
```typescript
// ❌ BAD - Race condition
test('loads data', async () => {
  render(<DataComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ✅ GOOD - Wait for async operation
test('loads data', async () => {
  render(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

#### 2. Memory Issues
```typescript
// ❌ BAD - Memory leak
afterEach(() => {
  // Cleanup not done
});

// ✅ GOOD - Proper cleanup
afterEach(() => {
  vi.clearAllMocks();
  cleanup(); // React Testing Library
  // Clear any global state
  resetGlobalState();
});
```

#### 3. Timing Issues
```typescript
// ❌ BAD - Fixed timeout
await page.waitForTimeout(5000);

// ✅ GOOD - Wait for condition
await page.waitForSelector('[data-testid="result"]');
await page.waitForLoadState('networkidle');
```

### Debug Tools
```typescript
// Debug test output
screen.debug(); // Print DOM
console.log(screen.getByRole('button', { name: /submit/i }));

// Playwright debugging
await page.pause(); // Interactive debugging
await page.screenshot({ path: 'debug.png' });
```

### Performance Optimization
```typescript
// Optimize test setup
beforeAll(async () => {
  // Expensive setup once
  await setupTestEnvironment();
});

beforeEach(() => {
  // Quick reset only
  resetTestState();
});
```

## 📊 Metrics và Monitoring

### Test Metrics Collection
```typescript
import { metricsCollector } from '@/test/utils/test-metrics';

test('performance tracking', async () => {
  const startTime = performance.now();
  
  // Test logic
  await performTestOperation();
  
  const duration = performance.now() - startTime;
  
  metricsCollector.collectTestMetric({
    testName: 'performance tracking',
    duration,
    status: 'passed',
    tags: ['performance'],
  });
});
```

### Automated Reporting
```typescript
// Generate test report after suite
afterAll(() => {
  const metrics = metricsCollector.exportToJSON();
  
  // Save metrics
  fs.writeFileSync(
    'test-results/metrics.json',
    JSON.stringify(metrics, null, 2)
  );
  
  // Send to monitoring service
  sendMetricsToMonitoring(metrics);
});
```

---

## 📝 Checklist

Trước khi commit code, hãy kiểm tra:

- [ ] Tests có tên mô tả rõ ràng
- [ ] Sử dụng AAA pattern
- [ ] Tests độc lập với nhau
- [ ] Mock external dependencies
- [ ] Handle error cases
- [ ] Performance acceptable
- [ ] Coverage đạt threshold
- [ ] Cleanup resources
- [ ] CI/CD passing
- [ ] Documentation updated

## 🔗 Resources

- [Testing Library Documentation](https://testing-library.com/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Ghi nhớ**: Good tests = Better code = Fewer bugs = Happy users! 🎯