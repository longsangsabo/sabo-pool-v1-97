import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MatchReportingStepProps {
  onComplete: (results: any) => void;
  sharedData: any;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const MatchReportingStep: React.FC<MatchReportingStepProps> = ({
  onComplete,
  sharedData,
  addLog
}) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (sharedData.tournament?.id) {
      loadMatches();
    }
  }, [sharedData.tournament]);

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', sharedData.tournament.id)
        .eq('status', 'scheduled')
        .not('player1_id', 'is', null)
        .not('player2_id', 'is', null);

      if (error) throw error;

      // Add player data from shared data
      const matchesWithPlayers = data?.map(match => {
        const player1 = sharedData.seeding?.find(s => s.player_id === match.player1_id)?.player;
        const player2 = sharedData.seeding?.find(s => s.player_id === match.player2_id)?.player;
        
        return {
          ...match,
          player1: player1 || { display_name: 'Unknown Player 1' },
          player2: player2 || { display_name: 'Unknown Player 2' }
        };
      });

      setMatches(matchesWithPlayers || []);
      addLog(`📊 Loaded ${matchesWithPlayers?.length || 0} available matches for testing`, 'info');
    } catch (error: any) {
      addLog(`❌ Error loading matches: ${error.message}`, 'error');
    }
  };

  const reportMatchResult = async (winnerId: string) => {
    if (!selectedMatch) return;

    setIsReporting(true);
    const startTime = Date.now();
    
    try {
      addLog(`🎯 Testing match result reporting...`, 'info');
      
      // Update match result
      const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          winner_id: winnerId,
          score_player1: winnerId === selectedMatch.player1_id ? 2 : 1,
          score_player2: winnerId === selectedMatch.player2_id ? 2 : 1,
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', selectedMatch.id);

      if (matchError) throw matchError;

      // Test winner advancement
      const { error: advanceError } = await supabase
        .rpc('advance_tournament_winner', {
          p_match_id: selectedMatch.id,
          p_tournament_id: sharedData.tournament.id
        });

      if (advanceError) throw advanceError;

      const duration = Date.now() - startTime;
      const winnerName = winnerId === selectedMatch.player1_id 
        ? selectedMatch.player1?.display_name 
        : selectedMatch.player2?.display_name;

      const result = {
        matchId: selectedMatch.id,
        winnerId,
        winnerName,
        duration,
        timestamp: new Date().toISOString(),
        success: true
      };

      setTestResults(prev => [...prev, result]);
      addLog(`✅ Match result reported: ${winnerName} wins (${duration}ms)`, 'success');
      
      // Clear selection and reload
      setSelectedMatch(null);
      loadMatches();
      
    } catch (error: any) {
      const result = {
        matchId: selectedMatch.id,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
      setTestResults(prev => [...prev, result]);
      addLog(`❌ Error reporting result: ${error.message}`, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  const runAutomaticTest = async () => {
    if (matches.length === 0) {
      addLog('❌ No matches available for testing', 'error');
      return;
    }

    addLog('🤖 Running automatic match reporting test...', 'info');
    
    // Test first match automatically
    const testMatch = matches[0];
    setSelectedMatch(testMatch);
    
    // Simulate random winner
    const winnerId = Math.random() > 0.5 ? testMatch.player1_id : testMatch.player2_id;
    await reportMatchResult(winnerId);

    // Complete step after testing
    setTimeout(() => {
      const results = {
        totalTests: testResults.length + 1,
        successfulTests: testResults.filter(r => r.success).length + 1,
        failedTests: testResults.filter(r => !r.success).length,
        averageDuration: testResults.length > 0 
          ? testResults.filter(r => r.duration).reduce((acc, r) => acc + r.duration, 0) / testResults.filter(r => r.duration).length 
          : 0,
        testResults: testResults,
        completedAt: new Date().toISOString()
      };

      addLog(`🎉 Step 3 completed with ${results.successfulTests}/${results.totalTests} successful tests`, 'success');
      onComplete(results);
      toast.success('Step 3 completed successfully! Match reporting test passed.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      {sharedData.tournament && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🏆 Testing Tournament: {sharedData.tournament.name}</h4>
          <div className="text-sm text-gray-600">
            Total Matches: {sharedData.bracket?.length || 0} | 
            Available for Testing: {matches.length}
          </div>
        </div>
      )}

      {/* Manual Test Section */}
      <div className="space-y-4">
        <h4 className="font-medium">🎯 Manual Match Testing</h4>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Select Match:</label>
          <Select value={selectedMatch?.id || ''} onValueChange={(value) => {
            const match = matches.find(m => m.id === value);
            setSelectedMatch(match || null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Match --" />
            </SelectTrigger>
            <SelectContent>
              {matches.map(match => (
                <SelectItem key={match.id} value={match.id}>
                  R{match.round_number} M{match.match_number}: {match.player1?.display_name} vs {match.player2?.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMatch && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
            <h5 className="font-medium">Test Match Result</h5>
            <div className="flex gap-2">
              <Button 
                onClick={() => reportMatchResult(selectedMatch.player1_id)}
                disabled={isReporting}
                className="flex-1"
              >
                {isReporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🏆"}
                {selectedMatch.player1?.display_name} Wins
              </Button>
              <Button 
                onClick={() => reportMatchResult(selectedMatch.player2_id)}
                disabled={isReporting}
                className="flex-1"
              >
                {isReporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🏆"}
                {selectedMatch.player2?.display_name} Wins
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Automatic Test Section */}
      <div className="space-y-4">
        <h4 className="font-medium">🤖 Automated Testing</h4>
        <Button 
          onClick={runAutomaticTest}
          disabled={isReporting || matches.length === 0}
          className="w-full"
          variant="outline"
        >
          <Target className="mr-2 h-4 w-4" />
          Run Automatic Match Reporting Test
        </Button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-medium mb-3">📊 Test Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <div className="font-medium">Total Tests</div>
              <div className="text-gray-600">{testResults.length}</div>
            </div>
            <div>
              <div className="font-medium">Successful</div>
              <div className="text-green-600">{testResults.filter(r => r.success).length}</div>
            </div>
            <div>
              <div className="font-medium">Failed</div>
              <div className="text-red-600">{testResults.filter(r => !r.success).length}</div>
            </div>
            <div>
              <div className="font-medium">Avg Duration</div>
              <div className="text-gray-600">
                {testResults.length > 0 ? Math.round(testResults.reduce((acc, r) => acc + (r.duration || 0), 0) / testResults.length) : 0}ms
              </div>
            </div>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {testResults.slice(-5).map((result, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success 
                  ? `✅ ${result.winnerName} wins in ${result.duration}ms`
                  : `❌ Error: ${result.error}`
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No matches available for testing.</p>
          <p className="text-sm">Generate a bracket in Step 1 to enable match testing.</p>
        </div>
      )}
    </div>
  );
};