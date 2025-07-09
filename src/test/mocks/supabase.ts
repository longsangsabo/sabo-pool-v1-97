// Enhanced Supabase Mock for Testing
import { vi } from 'vitest';

// Mock data factories
export const mockTournaments = [
  {
    id: 'tournament-1',
    name: 'Test Tournament 1',
    description: 'Test description',
    tournament_type: 'single_elimination',
    game_format: 'race_to_5',
    tier_level: 'amateur',
    max_participants: 32,
    current_participants: 16,
    registration_start: '2024-12-01T00:00:00Z',
    registration_end: '2024-12-15T00:00:00Z',
    tournament_start: '2024-12-20T00:00:00Z',
    tournament_end: '2024-12-22T00:00:00Z',
    venue_address: 'Test Venue',
    entry_fee: 100000,
    prize_pool: 500000,
    status: 'upcoming',
    is_public: true,
    is_visible: true,
    deleted_at: null,
    created_by: 'user-1',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
  {
    id: 'tournament-2',
    name: 'Deleted Tournament',
    description: 'This is a deleted tournament',
    tournament_type: 'single_elimination',
    status: 'cancelled',
    is_visible: false,
    deleted_at: '2024-11-10T00:00:00Z',
    created_by: 'user-1',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-10T00:00:00Z',
  }
];

export const mockUsers = [
  {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    display_name: 'TestUser',
    current_rank: 'Gold',
    is_admin: false,
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    display_name: 'AdminUser',
    current_rank: 'Diamond',
    is_admin: true,
  }
];

export const mockRegistrations = [
  {
    id: 'reg-1',
    tournament_id: 'tournament-1',
    player_id: 'user-1',
    registration_status: 'confirmed',
    payment_status: 'paid',
    status: 'confirmed',
    registration_date: '2024-11-05T00:00:00Z',
  }
];

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { 
        user: mockUsers[0] 
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  const createMockQueryBuilder = (tableName: string) => {
    let mockData = [];
    let mockFilters = {};
    let mockError = null;
    let shouldReturnSingle = false;
    
    // Set initial data based on table
    switch (tableName) {
      case 'tournaments':
        mockData = [...mockTournaments];
        break;
      case 'tournament_registrations':
        mockData = [...mockRegistrations];
        break;
      case 'profiles':
        mockData = [...mockUsers];
        break;
      default:
        mockData = [];
    }

    const builder = {
      // SELECT operations
      select: vi.fn().mockReturnThis(),
      
      // FILTER operations
      eq: vi.fn((column: string, value: any) => {
        mockData = mockData.filter(item => item[column] === value);
        return builder;
      }),
      
      neq: vi.fn((column: string, value: any) => {
        mockData = mockData.filter(item => item[column] !== value);
        return builder;
      }),
      
      in: vi.fn((column: string, values: any[]) => {
        mockData = mockData.filter(item => values.includes(item[column]));
        return builder;
      }),
      
      is: vi.fn((column: string, value: any) => {
        if (value === null) {
          mockData = mockData.filter(item => item[column] === null);
        }
        return builder;
      }),
      
      not: vi.fn((column: string, operator: string, value: any) => {
        if (operator === 'is' && value === null) {
          mockData = mockData.filter(item => item[column] !== null);
        }
        return builder;
      }),
      
      ilike: vi.fn((column: string, pattern: string) => {
        const searchTerm = pattern.replace(/%/g, '');
        mockData = mockData.filter(item => 
          item[column]?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return builder;
      }),
      
      or: vi.fn((query: string) => {
        // Simple OR implementation for name/description search
        if (query.includes('name.ilike') && query.includes('description.ilike')) {
          const searchTerm = query.match(/%(.*?)%/)?.[1] || '';
          mockData = mockData.filter(item => 
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return builder;
      }),
      
      // ORDERING
      order: vi.fn((column: string, options?: { ascending?: boolean }) => {
        const ascending = options?.ascending ?? true;
        mockData.sort((a, b) => {
          if (ascending) {
            return a[column] > b[column] ? 1 : -1;
          } else {
            return a[column] < b[column] ? 1 : -1;
          }
        });
        return builder;
      }),
      
      // PAGINATION
      limit: vi.fn((count: number) => {
        mockData = mockData.slice(0, count);
        return builder;
      }),
      
      range: vi.fn((from: number, to: number) => {
        mockData = mockData.slice(from, to + 1);
        return builder;
      }),
      
      // RESULT METHODS
      single: vi.fn(() => {
        shouldReturnSingle = true;
        return builder;
      }),
      
      maybeSingle: vi.fn(() => {
        shouldReturnSingle = true;
        return builder;
      }),
      
      // EXECUTION
      then: vi.fn((callback) => {
        const result = {
          data: shouldReturnSingle ? (mockData[0] || null) : mockData,
          error: mockError,
          count: mockData.length
        };
        return Promise.resolve(callback(result));
      }),
      
      // INSERT operations
      insert: vi.fn((data: any) => {
        const newItem = {
          id: `new-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...data
        };
        
        // Add to mock data for chaining
        mockData = [newItem];
        
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newItem,
              error: null
            })
          })
        };
      }),
      
      // UPDATE operations
      update: vi.fn((data: any) => {
        if (mockData.length > 0) {
          mockData[0] = { ...mockData[0], ...data, updated_at: new Date().toISOString() };
        }
        return {
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockData[0] || null,
                error: mockError
              })
            })
          })
        };
      }),
      
      // DELETE operations
      delete: vi.fn(() => {
        return {
          eq: vi.fn().mockResolvedValue({
            data: mockData,
            error: mockError
          })
        };
      })
    };

    return builder;
  };

  return {
    auth: mockAuth,
    from: vi.fn(createMockQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    
    // Channel/realtime mocking
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue('SUBSCRIBED'),
    }),
    removeChannel: vi.fn(),
  };
};

// Export the mock client
export const mockSupabase = createMockSupabaseClient();

// Helper functions for test setup
export const setupSupabaseMocks = () => {
  vi.clearAllMocks();
};

export const setMockError = (error: any) => {
  // This could be enhanced to set specific errors for specific operations
  mockSupabase.from = vi.fn(() => {
    const builder = createMockQueryBuilder('');
    builder.then = vi.fn(() => Promise.resolve({ data: null, error }));
    return builder;
  });
};

export const setMockUser = (user: any) => {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null
  });
};

export const resetMockUser = () => {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: mockUsers[0] },
    error: null
  });
};

// Toast mocking
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};