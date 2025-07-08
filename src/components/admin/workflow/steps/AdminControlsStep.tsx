import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, UserX, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminControlsStepProps {
  onComplete: (results: any) => void;
  sharedData: any;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const AdminControlsStep: React.FC<AdminControlsStepProps> = ({
  onComplete,
  sharedData,
  addLog
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState('');

  const adminActions = [
    {
      id: 'override_match',
      name: 'Override Match Result',
      description: 'Test admin ability to override tournament match results',
      icon: '⚽'
    },
    {
      id: 'disqualify_player',
      name: 'Disqualify Player',
      description: 'Test player disqualification functionality',
      icon: '🚫'
    },
    {
      id: 'pause_tournament',
      name: 'Pause/Resume Tournament',
      description: 'Test tournament pause and resume controls',
      icon: '⏸️'
    },
    {
      id: 'emergency_reset',
      name: 'Emergency Reset',
      description: 'Test emergency tournament reset functionality',
      icon: '🆘'
    },
    {
      id: 'bulk_operations',
      name: 'Bulk Operations',
      description: 'Test bulk player/match management operations',
      icon: '📦'
    }
  ];

  const executeAdminAction = async (actionId: string) => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      addLog(`🛡️ Testing admin action: ${actionId}`, 'info');

      let result = { success: false, details: '' };

      switch (actionId) {
        case 'override_match':
          result = await testMatchOverride();
          break;
        case 'disqualify_player':
          result = await testPlayerDisqualification();
          break;
        case 'pause_tournament':
          result = await testTournamentPause();
          break;
        case 'emergency_reset':
          result = await testEmergencyReset();
          break;
        case 'bulk_operations':
          result = await testBulkOperations();
          break;
        default:
          throw new Error('Unknown action');
      }

      const duration = Date.now() - startTime;
      const testResult = {
        action: actionId,
        success: result.success,
        duration,
        details: result.details,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [...prev, testResult]);
      addLog(`${result.success ? '✅' : '❌'} ${actionId}: ${result.details} (${duration}ms)`, 
        result.success ? 'success' : 'error');

    } catch (error: any) {
      const testResult = {
        action: actionId,
        success: false,
        duration: Date.now() - startTime,
        details: error.message,
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [...prev, testResult]);
      addLog(`❌ ${actionId} failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const testMatchOverride = async () => {
    // Find a completed match to override
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', sharedData.tournament?.id)
      .eq('status', 'completed')
      .limit(1);

    if (!matches || matches.length === 0) {
      return { success: false, details: 'No completed matches found to override' };
    }

    const match = matches[0];
    const newWinner = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;

    // Admin override
    const { error } = await supabase
      .from('tournament_matches')
      .update({
        winner_id: newWinner,
        notes: 'Admin override for testing purposes',
        updated_at: new Date().toISOString()
      })
      .eq('id', match.id);

    if (error) throw error;

    return { success: true, details: `Successfully overrode match ${match.id} winner` };
  };

  const testPlayerDisqualification = async () => {
    // Find a player to temporarily disqualify
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', sharedData.tournament?.id)
      .eq('registration_status', 'confirmed')
      .limit(1);

    if (!registrations || registrations.length === 0) {
      return { success: false, details: 'No players found to disqualify' };
    }

    const registration = registrations[0];

    // Mark as disqualified
    const { error } = await supabase
      .from('tournament_registrations')
      .update({
        registration_status: 'disqualified',
        notes: 'Test disqualification - will be reverted'
      })
      .eq('id', registration.id);

    if (error) throw error;

    // Immediately revert for testing
    await supabase
      .from('tournament_registrations')
      .update({ registration_status: 'confirmed', notes: null })
      .eq('id', registration.id);

    return { success: true, details: `Successfully tested disqualification for player ${registration.player_id}` };
  };

  const testTournamentPause = async () => {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('status')
      .eq('id', sharedData.tournament?.id)
      .single();

    if (!tournament) throw new Error('Tournament not found');

    // Pause tournament
    const { error: pauseError } = await supabase
      .from('tournaments')
      .update({ status: 'paused' })
      .eq('id', sharedData.tournament?.id);

    if (pauseError) throw pauseError;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Resume tournament
    const { error: resumeError } = await supabase
      .from('tournaments')
      .update({ status: tournament.status }) // Restore original status
      .eq('id', sharedData.tournament?.id);

    if (resumeError) throw resumeError;

    return { success: true, details: 'Successfully paused and resumed tournament' };
  };

  const testEmergencyReset = async () => {
    // This is a dangerous operation, so we'll just simulate it
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('id')
      .eq('tournament_id', sharedData.tournament?.id)
      .limit(5);

    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', sharedData.tournament?.id)
      .limit(5);

    // Simulate emergency reset without actually doing it
    return { 
      success: true, 
      details: `Emergency reset simulation: Would affect ${matches?.length || 0} matches and ${registrations?.length || 0} registrations` 
    };
  };

  const testBulkOperations = async () => {
    // Test bulk status updates
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('id, status')
      .eq('tournament_id', sharedData.tournament?.id)
      .limit(3);

    if (!matches || matches.length === 0) {
      return { success: false, details: 'No matches found for bulk operations' };
    }

    // Bulk update match notes (safe operation)
    const { error } = await supabase
      .from('tournament_matches')
      .update({ notes: 'Bulk operation test - ' + new Date().toISOString() })
      .in('id', matches.map(m => m.id));

    if (error) throw error;

    return { success: true, details: `Successfully performed bulk operation on ${matches.length} matches` };
  };

  const runAllTests = async () => {
    addLog(`🔄 Running all admin control tests...`, 'info');
    
    for (const action of adminActions) {
      await executeAdminAction(action.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const results = {
      totalTests: testResults.length + adminActions.length,
      successfulTests: testResults.filter(r => r.success).length,
      failedTests: testResults.filter(r => !r.success).length,
      averageDuration: testResults.reduce((acc, r) => acc + r.duration, 0) / testResults.length,
      testResults,
      completedAt: new Date().toISOString()
    };

    onComplete(results);
    toast.success('🎉 Admin controls testing completed!');
  };

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h4 className="font-medium mb-2">🛡️ Admin Controls Testing</h4>
        <p className="text-sm text-gray-600">
          Testing administrative functions and emergency controls for tournament management.
        </p>
      </div>

      {/* Action Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Admin Action:</label>
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger>
              <SelectValue placeholder="-- Choose Action --" />
            </SelectTrigger>
            <SelectContent>
              {adminActions.map(action => (
                <SelectItem key={action.id} value={action.id}>
                  <div className="flex items-center gap-2">
                    <span>{action.icon}</span>
                    <div>
                      <div className="font-medium">{action.name}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => selectedAction && executeAdminAction(selectedAction)}
            disabled={isProcessing || !selectedAction}
            className="flex-1"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Execute Action
          </Button>
          
          <Button 
            onClick={runAllTests}
            disabled={isProcessing}
            variant="outline"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>Warning:</strong> These are administrative functions that can affect tournament integrity. 
            In production, these should be restricted to verified administrators only.
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
                {Math.round(testResults.reduce((acc, r) => acc + r.duration, 0) / testResults.length)}ms
              </div>
            </div>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {testResults.slice(-5).map((result, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? '✅' : '❌'} {result.action}: {result.details} ({result.duration}ms)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};