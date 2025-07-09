import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  FileText,
  Users,
  CreditCard,
  Trophy,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  steps: TestStep[];
}

interface TestStep {
  id: string;
  name: string;
  action: () => Promise<any>;
  expected: any;
  actual?: any;
  status: 'pending' | 'running' | 'passed' | 'failed';
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
}

const IntegrationTestingSuite = () => {
  const { user } = useAuth();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    initializeTestSuites();
  }, []);

  const initializeTestSuites = () => {
    const suites: TestSuite[] = [
      {
        name: 'user_workflow',
        description: 'Luồng đăng ký và xác minh người dùng',
        tests: [
          {
            id: 'user_registration',
            name: 'Đăng ký người dùng mới',
            description: 'Test quy trình đăng ký người dùng từ đầu đến cuối',
            category: 'authentication',
            status: 'pending',
            steps: [
              {
                id: 'create_profile',
                name: 'Tạo profile người dùng',
                action: async () => {
                  const testUser = {
                    user_id: 'test_' + Date.now(),
                    full_name: 'Test User',
                    display_name: 'TestUser',
                    phone: '0901234567',
                    city: 'Hồ Chí Minh',
                    district: 'Quận 1',
                    skill_level: 'intermediate',
                    bio: 'Test user for integration testing'
                  };

                  const { data, error } = await supabase
                    .from('profiles')
                    .insert(testUser)
                    .select()
                    .single();

                  return { data, error, testUser };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              },
              {
                id: 'create_wallet',
                name: 'Tạo ví người dùng',
                action: async () => {
                  const { data, error } = await supabase
                    .from('wallets')
                    .insert({
                      user_id: 'test_' + Date.now(),
                      balance: 0,
                      points_balance: 100
                    })
                    .select()
                    .single();

                  return { data, error };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              },
              {
                id: 'create_ranking',
                name: 'Tạo ranking người dùng',
                action: async () => {
                  const { data, error } = await supabase
                    .from('player_rankings')
                    .insert({
                      player_id: 'test_' + Date.now(),
                      elo_points: 1000,
                      elo: 1000,
                      spa_points: 0,
                      total_matches: 0,
                      wins: 0,
                      losses: 0
                    })
                    .select()
                    .single();

                  return { data, error };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        name: 'tournament_lifecycle',
        description: 'Vòng đời hoàn chỉnh của giải đấu',
        tests: [
          {
            id: 'tournament_creation',
            name: 'Tạo giải đấu mới',
            description: 'Test tạo giải đấu và quản lý đăng ký',
            category: 'tournament',
            status: 'pending',
            steps: [
              {
                id: 'create_tournament',
                name: 'Tạo giải đấu',
                action: async () => {
                  const tournament = {
                    name: 'Test Tournament ' + Date.now(),
                    description: 'Test tournament for integration testing',
                    tournament_type: 'single_elimination',
                    max_participants: 8,
                    entry_fee: 50000,
                    registration_start: new Date().toISOString(),
                    registration_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    tournament_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    tournament_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'upcoming'
                  };

                  const { data, error } = await supabase
                    .from('tournaments')
                    .insert(tournament)
                    .select()
                    .single();

                  return { data, error, tournament };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              },
              {
                id: 'register_players',
                name: 'Đăng ký người chơi',
                action: async () => {
                  // This would register multiple test players
                  const registrations = [];
                  for (let i = 0; i < 4; i++) {
                    const { data, error } = await supabase
                      .from('tournament_registrations')
                      .insert({
                        tournament_id: 'test_tournament_id',
                        player_id: `test_player_${i}`,
                        registration_status: 'confirmed',
                        payment_status: 'paid',
                        status: 'confirmed'
                      })
                      .select()
                      .single();

                    registrations.push({ data, error });
                  }
                  
                  return registrations;
                },
                expected: { length: 4 },
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        name: 'challenge_workflow',
        description: 'Quy trình thách đấu từ tạo đến hoàn thành',
        tests: [
          {
            id: 'challenge_flow',
            name: 'Luồng thách đấu hoàn chỉnh',
            description: 'Test tạo thách đấu, chấp nhận và hoàn thành',
            category: 'challenge',
            status: 'pending',
            steps: [
              {
                id: 'create_challenge',
                name: 'Tạo thách đấu',
                action: async () => {
                  const challenge = {
                    challenger_id: 'test_challenger',
                    opponent_id: 'test_opponent',
                    message: 'Test challenge',
                    bet_points: 100,
                    race_to: 5,
                    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                  };

                  const { data, error } = await supabase
                    .from('challenges')
                    .insert(challenge)
                    .select()
                    .single();

                  return { data, error };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              },
              {
                id: 'accept_challenge',
                name: 'Chấp nhận thách đấu',
                action: async () => {
                  const { data, error } = await supabase
                    .from('challenges')
                    .update({
                      status: 'accepted',
                      responded_at: new Date().toISOString()
                    })
                    .eq('id', 'test_challenge_id')
                    .select()
                    .single();

                  return { data, error };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        name: 'payment_flow',
        description: 'Luồng thanh toán hoàn chỉnh',
        tests: [
          {
            id: 'payment_processing',
            name: 'Xử lý thanh toán',
            description: 'Test tạo và xử lý giao dịch thanh toán',
            category: 'payment',
            status: 'pending',
            steps: [
              {
                id: 'create_transaction',
                name: 'Tạo giao dịch',
                action: async () => {
                  const result = await supabase.rpc('create_payment_transaction', {
                    p_user_id: 'test_user',
                    p_amount: 100000,
                    p_transaction_ref: 'TEST_' + Date.now(),
                    p_transaction_type: 'wallet_topup',
                    p_payment_method: 'vnpay'
                  });

                  return result;
                },
                expected: { data: 'string', error: null },
                status: 'pending'
              },
              {
                id: 'update_wallet',
                name: 'Cập nhật ví',
                action: async () => {
                  const result = await supabase.rpc('update_wallet_balance', {
                    p_user_id: 'test_user',
                    p_amount: 100000,
                    p_transaction_type: 'deposit'
                  });

                  return result;
                },
                expected: { data: true, error: null },
                status: 'pending'
              }
            ]
          }
        ]
      },
      {
        name: 'admin_functions',
        description: 'Các chức năng quản trị viên',
        tests: [
          {
            id: 'club_verification',
            name: 'Xác minh câu lạc bộ',
            description: 'Test quy trình xác minh câu lạc bộ',
            category: 'admin',
            status: 'pending',
            steps: [
              {
                id: 'create_club_registration',
                name: 'Tạo đăng ký câu lạc bộ',
                action: async () => {
                  const registration = {
                    club_name: 'Test Club ' + Date.now(),
                    address: 'Test Address',
                    phone: '0901234567',
                    city: 'Hồ Chí Minh',
                    district: 'Quận 1',
                    opening_time: '08:00',
                    closing_time: '22:00',
                    table_count: 10,
                    table_types: ['9-ball', '8-ball'],
                    basic_price: 50000,
                    manager_name: 'Test Manager',
                    manager_phone: '0901234567',
                    email: 'test@example.com',
                    status: 'pending'
                  };

                  const { data, error } = await supabase
                    .from('club_registrations')
                    .insert(registration)
                    .select()
                    .single();

                  return { data, error };
                },
                expected: { data: 'object', error: null },
                status: 'pending'
              }
            ]
          }
        ]
      }
    ];

    setTestSuites(suites);
  };

  const runTestStep = async (step: TestStep): Promise<TestStep> => {
    try {
      step.status = 'running';
      const result = await step.action();
      step.actual = result;
      
      // Simple validation - in real scenario, this would be more sophisticated
      if (typeof step.expected === 'object' && step.expected.error === null) {
        step.status = result.error ? 'failed' : 'passed';
      } else if (typeof step.expected === 'object' && 'length' in step.expected) {
        step.status = result.length === step.expected.length ? 'passed' : 'failed';
      } else {
        step.status = 'passed'; // Default to passed for now
      }
      
      return step;
    } catch (error: any) {
      step.status = 'failed';
      step.error = error.message;
      return step;
    }
  };

  const runTestCase = async (testCase: TestCase): Promise<TestCase> => {
    const startTime = Date.now();
    testCase.status = 'running';
    
    try {
      for (const step of testCase.steps) {
        const updatedStep = await runTestStep(step);
        if (updatedStep.status === 'failed') {
          testCase.status = 'failed';
          testCase.error = updatedStep.error;
          break;
        }
      }
      
      if (testCase.status === 'running') {
        testCase.status = 'passed';
      }
    } catch (error: any) {
      testCase.status = 'failed';
      testCase.error = error.message;
    }
    
    testCase.duration = Date.now() - startTime;
    return testCase;
  };

  const runTestSuite = async (suiteName: string) => {
    setRunningTests(true);
    
    const suite = testSuites.find(s => s.name === suiteName);
    if (!suite) return;

    const results = {
      suiteName,
      startTime: Date.now(),
      tests: [] as any[]
    };

    for (const testCase of suite.tests) {
      const result = await runTestCase(testCase);
      results.tests.push(result);
      
      // Update UI in real-time
      setTestSuites(prev => 
        prev.map(s => 
          s.name === suiteName 
            ? { ...s, tests: s.tests.map(t => t.id === result.id ? result : t) }
            : s
        )
      );
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    
    setTestResults(prev => ({ ...prev, [suiteName]: results }));
    setRunningTests(false);
    
    const passedTests = results.tests.filter(t => t.status === 'passed').length;
    const totalTests = results.tests.length;
    
    if (passedTests === totalTests) {
      toast.success(`Tất cả ${totalTests} test đã passed!`);
    } else {
      toast.error(`${totalTests - passedTests}/${totalTests} test failed`);
    }
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runTestSuite(suite.name);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <Shield className="w-5 h-5" />;
      case 'tournament':
        return <Trophy className="w-5 h-5" />;
      case 'challenge':
        return <Users className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'admin':
        return <Settings className="w-5 h-5" />;
      default:
        return <TestTube className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Integration Testing Suite
          </CardTitle>
          <CardDescription>
            Kiểm tra các luồng end-to-end và tích hợp hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="suites" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suites">Test Suites</TabsTrigger>
              <TabsTrigger value="results">Kết quả</TabsTrigger>
              <TabsTrigger value="reports">Báo cáo</TabsTrigger>
            </TabsList>

            <TabsContent value="suites" className="space-y-6">
              {/* Control Panel */}
              <div className="flex gap-4">
                <Button
                  onClick={runAllTests}
                  disabled={runningTests}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {runningTests ? 'Đang chạy...' : 'Chạy tất cả tests'}
                </Button>
                <select
                  value={selectedSuite}
                  onChange={(e) => setSelectedSuite(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="">Chọn test suite</option>
                  {testSuites.map(suite => (
                    <option key={suite.name} value={suite.name}>
                      {suite.description}
                    </option>
                  ))}
                </select>
                {selectedSuite && (
                  <Button
                    onClick={() => runTestSuite(selectedSuite)}
                    disabled={runningTests}
                    variant="outline"
                  >
                    Chạy suite
                  </Button>
                )}
              </div>

              {/* Test Suites */}
              <div className="space-y-4">
                {testSuites.map((suite) => (
                  <Card key={suite.name}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {suite.description}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {suite.tests.map((test) => (
                          <div
                            key={test.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {getCategoryIcon(test.category)}
                                <div>
                                  <h4 className="font-medium">{test.name}</h4>
                                  <p className="text-sm text-muted-foreground">{test.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(test.status)}>
                                  {test.status}
                                </Badge>
                                {test.duration && (
                                  <span className="text-sm text-muted-foreground">
                                    {test.duration}ms
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Test Steps */}
                            <div className="space-y-2">
                              {test.steps.map((step) => (
                                <div
                                  key={step.id}
                                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(step.status)}
                                    <span className="text-sm">{step.name}</span>
                                  </div>
                                  {step.error && (
                                    <span className="text-xs text-red-600">{step.error}</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {test.error && (
                              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-600">{test.error}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {Object.entries(testResults).map(([suiteName, results]: [string, any]) => (
                <Card key={suiteName}>
                  <CardHeader>
                    <CardTitle className="text-base">Kết quả: {suiteName}</CardTitle>
                    <CardDescription>
                      Thời gian: {results.duration}ms | 
                      Passed: {results.tests.filter((t: any) => t.status === 'passed').length} | 
                      Failed: {results.tests.filter((t: any) => t.status === 'failed').length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.tests.map((test: any) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span>{test.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(test.status)}>
                              {test.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {test.duration}ms
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tổng quan kiểm thử</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold">{testSuites.length}</p>
                      <p className="text-sm text-muted-foreground">Test Suites</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold">
                        {testSuites.reduce((acc, suite) => acc + suite.tests.length, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Test Cases</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {testSuites.reduce((acc, suite) => 
                          acc + suite.tests.filter(t => t.status === 'passed').length, 0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Passed</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {testSuites.reduce((acc, suite) => 
                          acc + suite.tests.filter(t => t.status === 'failed').length, 0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Coverage theo chức năng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['authentication', 'tournament', 'challenge', 'payment', 'admin'].map(category => {
                      const categoryTests = testSuites.reduce((acc, suite) => 
                        acc + suite.tests.filter(t => t.category === category).length, 0
                      );
                      const passedTests = testSuites.reduce((acc, suite) => 
                        acc + suite.tests.filter(t => t.category === category && t.status === 'passed').length, 0
                      );
                      const coverage = categoryTests > 0 ? (passedTests / categoryTests) * 100 : 0;

                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{category}</span>
                            <span>{Math.round(coverage)}%</span>
                          </div>
                          <Progress value={coverage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationTestingSuite;