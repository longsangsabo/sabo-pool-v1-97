import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Play, RotateCcw, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'RUNNING';
  details?: any;
  error?: any;
  duration?: number;
}

export function RankingSystemTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (result: TestResult) => {
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.test === result.test);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  // TEST 1: Tournament Points
  const testTournamentPoints = async () => {
    const startTime = Date.now();
    updateTestResult({ test: 'Tournament Points', status: 'RUNNING' });
    
    try {
      // Get test players with different ranks
      const { data: players } = await supabase
        .from('player_rankings')
        .select('player_id, current_rank_id, ranks!current_rank_id(code)')
        .limit(4);

      if (!players || players.length < 4) {
        throw new Error('Need at least 4 test players');
      }

      // Create test tournament
      const { data: tournament } = await supabase
        .from('tournaments')
        .insert({
          name: 'Test Tournament - Points',
          status: 'in_progress',
          max_participants: 8,
          metadata: { type: 'season' } // 1.5x multiplier
        })
        .select()
        .single();

      // Add tournament registrations with positions
      const positions = [
        { position: 1, player_id: players[0].player_id },
        { position: 2, player_id: players[1].player_id },
        { position: 3, player_id: players[2].player_id },
        { position: 8, player_id: players[3].player_id } // participation
      ];

      await supabase.from('tournament_registrations').insert(
        positions.map(p => ({
          tournament_id: tournament.id,
          player_id: p.player_id,
          registration_status: 'confirmed',
          final_position: p.position
        }))
      );

      // Complete tournament (this should trigger the function)
      await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournament.id);

      // Wait a bit for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify points were awarded
      const { data: points } = await supabase
        .from('spa_points_log')
        .select('*')
        .eq('source_type', 'tournament')
        .eq('source_id', tournament.id);

      const duration = Date.now() - startTime;
      updateTestResult({
        test: 'Tournament Points',
        status: points && points.length === 4 ? 'PASS' : 'FAIL',
        details: { expectedEntries: 4, actualEntries: points?.length || 0, points },
        duration
      });

    } catch (error) {
      updateTestResult({
        test: 'Tournament Points',
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // TEST 2: Challenge Daily Limits
  const testChallengeLimits = async () => {
    const startTime = Date.now();
    updateTestResult({ test: 'Challenge Daily Limits', status: 'RUNNING' });
    
    try {
      // Get a test player
      const { data: players } = await supabase
        .from('player_rankings')
        .select('player_id')
        .limit(2);

      if (!players || players.length < 2) {
        throw new Error('Need at least 2 test players');
      }

      const winnerId = players[0].player_id;
      const loserId = players[1].player_id;

      // Test challenge completion with daily limits
      const results = [];
      
      for (let i = 1; i <= 3; i++) {
        const matchId = `test-match-daily-${Date.now()}-${i}`;
        
        // Call the challenge completion function
        const { data: result } = await supabase.rpc('complete_challenge_match', {
          p_match_id: matchId,
          p_winner_id: winnerId,
          p_loser_id: loserId,
          p_wager_points: 100
        });

        results.push({ challenge: i, result });
      }

      // Check that 3rd challenge has reduced multiplier
      const thirdResult = results[2]?.result;
      const expectedReduction = thirdResult?.multiplier === 0.3;

      const duration = Date.now() - startTime;
      updateTestResult({
        test: 'Challenge Daily Limits',
        status: expectedReduction ? 'PASS' : 'FAIL',
        details: { 
          results,
          thirdChallengeMultiplier: thirdResult?.multiplier,
          expectedMultiplier: 0.3
        },
        duration
      });

    } catch (error) {
      updateTestResult({
        test: 'Challenge Daily Limits',
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // TEST 3: Rank Promotion
  const testRankPromotion = async () => {
    const startTime = Date.now();
    updateTestResult({ test: 'Rank Promotion', status: 'RUNNING' });
    
    try {
      // Get K rank ID
      const { data: kRank } = await supabase
        .from('ranks')
        .select('id')
        .eq('code', 'K')
        .single();

      // Create/update test player with 950 SPA points (close to promotion)
      const testPlayerId = `test-promotion-${Date.now()}`;
      
      await supabase.from('player_rankings').upsert({
        player_id: testPlayerId,
        current_rank_id: kRank.id,
        spa_points: 950,
        total_matches: 0,
        wins: 0
      });

      // Award enough points to trigger promotion
      await supabase.from('spa_points_log').insert({
        player_id: testPlayerId,
        source_type: 'tournament',
        points_earned: 100,
        description: 'Promotion test points'
      });

      // Update player ranking to trigger promotion check
      await supabase
        .from('player_rankings')
        .update({ spa_points: 1050 })
        .eq('player_id', testPlayerId);

      // Wait for triggers to execute
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if promoted (should be at K+ now)
      const { data: ranking } = await supabase
        .from('player_rankings')
        .select('spa_points, ranks!current_rank_id(code)')
        .eq('player_id', testPlayerId)
        .single();

      const duration = Date.now() - startTime;
      const rankData = Array.isArray(ranking?.ranks) ? ranking?.ranks[0] : ranking?.ranks;
      const wasPromoted = rankData?.code === 'K+';
      
      updateTestResult({
        test: 'Rank Promotion',
        status: wasPromoted ? 'PASS' : 'FAIL',
        details: { 
          finalRank: rankData?.code,
          finalSPA: ranking?.spa_points,
          expectedRank: 'K+',
          wasPromoted
        },
        duration
      });

    } catch (error) {
      updateTestResult({
        test: 'Rank Promotion',
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // TEST 4: Season Reset
  const testSeasonReset = async () => {
    const startTime = Date.now();
    updateTestResult({ test: 'Season Reset', status: 'RUNNING' });
    
    try {
      // Check current rankings before reset
      const { data: beforeReset } = await supabase
        .from('player_rankings')
        .select('player_id, rank_points')
        .gt('rank_points', 0)
        .limit(5);

      // Call reset season function
      const { error } = await supabase.rpc('reset_season');
      
      if (error) throw error;

      // Wait for function to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify all rank points are reset to 0
      const { data: afterReset } = await supabase
        .from('player_rankings')
        .select('player_id, rank_points')
        .gt('rank_points', 0);

      // Check if history was created
      const { data: history } = await supabase
        .from('elo_history')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .limit(5);

      const duration = Date.now() - startTime;
      const allPointsReset = !afterReset || afterReset.length === 0;
      
      updateTestResult({
        test: 'Season Reset',
        status: allPointsReset ? 'PASS' : 'FAIL',
        details: {
          playersBeforeReset: beforeReset?.length || 0,
          playersAfterReset: afterReset?.length || 0,
          historyEntriesCreated: history?.length || 0,
          allPointsReset
        },
        duration
      });

    } catch (error) {
      updateTestResult({
        test: 'Season Reset',
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Generate test data
  const generateTestData = async () => {
    setIsRunning(true);
    try {
      const ranks = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+'];
      
      for (let i = 0; i < ranks.length; i++) {
        const { data: rank } = await supabase
          .from('ranks')
          .select('id')
          .eq('code', ranks[i])
          .single();

        const testPlayerId = `test-player-${ranks[i]}-${Date.now()}`;
        
        await supabase.from('player_rankings').upsert({
          player_id: testPlayerId,
          current_rank_id: rank.id,
          spa_points: Math.floor(Math.random() * 800) + 100,
          rank_points: Math.random() * 2,
          total_matches: Math.floor(Math.random() * 20),
          wins: Math.floor(Math.random() * 15)
        });
      }
      
      toast.success(`Generated ${ranks.length} test players`);
    } catch (error) {
      toast.error('Failed to generate test data: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      await testTournamentPoints();
      await testChallengeLimits();
      await testRankPromotion();
      await testSeasonReset();
      
      toast.success('All tests completed!');
    } catch (error) {
      toast.error('Test suite failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'RUNNING':
        return <RotateCcw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      PASS: 'default',
      FAIL: 'destructive',
      ERROR: 'secondary',
      RUNNING: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ranking System Test Suite</h1>
        <Badge variant="outline">Admin Only</Badge>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex-1 min-w-[200px]"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            
            <Button 
              onClick={generateTestData} 
              variant="outline"
              disabled={isRunning}
            >
              <Database className="h-4 w-4 mr-2" />
              Generate Test Data
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={testTournamentPoints} variant="outline" size="sm" disabled={isRunning}>
              Tournament Points
            </Button>
            <Button onClick={testChallengeLimits} variant="outline" size="sm" disabled={isRunning}>
              Daily Limits
            </Button>
            <Button onClick={testRankPromotion} variant="outline" size="sm" disabled={isRunning}>
              Rank Promotion
            </Button>
            <Button onClick={testSeasonReset} variant="outline" size="sm" disabled={isRunning}>
              Season Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Test Results</h2>
        
        {testResults.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tests run yet. Click "Run All Tests" to begin.
            </CardContent>
          </Card>
        ) : (
          testResults.map((result, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{result.test}</CardTitle>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <Badge variant="outline">{result.duration}ms</Badge>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              </CardHeader>
              
              {(result.details || result.error) && (
                <CardContent>
                  {result.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-3">
                      <p className="text-red-800 font-medium">Error:</p>
                      <p className="text-red-700 text-sm">{result.error}</p>
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-2">Details:</p>
                      <pre className="text-xs overflow-auto max-h-48">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}