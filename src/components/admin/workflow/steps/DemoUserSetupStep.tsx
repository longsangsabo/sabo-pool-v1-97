import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DemoUserManager } from '../../DemoUserManager';

interface DemoUserSetupStepProps {
  onComplete: (results: any) => void;
  sharedData: any;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const DemoUserSetupStep: React.FC<DemoUserSetupStepProps> = ({
  onComplete,
  sharedData,
  addLog
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any>(null);

  const verifyDemoUserSystem = async () => {
    setIsVerifying(true);
    addLog('🔍 Verifying demo user system...');
    
    try {
      // Use RPC to avoid TypeScript type inference issues
      const { data: stats, error } = await supabase.rpc('get_demo_user_stats');
      
      if (error) {
        addLog(`❌ Error checking demo users: ${error.message}`, 'error');
        return;
      }

      const statsData = stats as any;
      const count = statsData?.total_demo_users || 0;
      addLog(`📊 Demo users in system: ${count}/32`);
      
      const results = {
        totalUsers: count,
        requiredUsers: 32,
        isSystemReady: count >= 32,
        systemStatus: count >= 32 ? 'ready' : 'needs_initialization',
        verifiedAt: new Date().toISOString()
      };

      setVerificationResults(results);
      
      if (count >= 32) {
        addLog('✅ Demo user system ready!', 'success');
      } else {
        addLog('⚠️ Need to initialize demo users first', 'error');
      }

    } catch (error: any) {
      addLog(`❌ Verification failed: ${error.message}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const completeSetup = async () => {
    const completionResults = {
      demoUsersReady: verificationResults?.isSystemReady || false,
      totalDemoUsers: verificationResults?.totalUsers || 0,
      systemStatus: verificationResults?.systemStatus || 'unknown',
      setupCompletedAt: new Date().toISOString()
    };

    addLog('🎉 Demo user setup completed! System ready for tournament testing.', 'success');
    onComplete(completionResults);
  };

  useEffect(() => {
    verifyDemoUserSystem();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h4 className="font-medium mb-2">👥 Demo User System Setup</h4>
        <p className="text-sm text-gray-600">
          Initialize and manage 32 pre-seeded demo users for tournament testing. 
          These users provide instant population capabilities without manual registration.
        </p>
      </div>

      {/* System Status */}
      {verificationResults && (
        <Alert>
          {verificationResults.isSystemReady ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>✅ System Ready:</strong> {verificationResults.totalUsers}/32 demo users available and ready for testing.
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ Initialization Required:</strong> Only {verificationResults.totalUsers}/32 demo users found. 
                Use the demo user manager below to initialize the missing users.
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Demo User Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demo User Management
          </CardTitle>
          <CardDescription>
            Manage the 32 demo users for tournament testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemoUserManager addLog={addLog} />
        </CardContent>
      </Card>

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🎯 Demo User Features
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>• 32 pre-configured Vietnamese users</div>
            <div>• Mixed skill levels (Expert, Advanced, Intermediate)</div>
            <div>• ELO ratings from 1010 to 1450</div>
            <div>• Complete profiles with rankings and wallets</div>
            <div>• Instant availability for tournament testing</div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            🚀 Testing Benefits
          </h4>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <div>• No manual user registration needed</div>
            <div>• Balanced skill distribution for realistic brackets</div>
            <div>• Reusable across multiple tournaments</div>
            <div>• Automatic cleanup and release system</div>
            <div>• Comprehensive testing scenarios</div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex gap-2">
        <Button 
          onClick={verifyDemoUserSystem}
          disabled={isVerifying}
          variant="outline"
        >
          {isVerifying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Refresh System Status
        </Button>
      </div>

      {/* Completion */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-2">
            📊 Setup Summary
          </h4>
          <div className="text-sm space-y-1">
            <div>✅ Demo users: {verificationResults?.totalUsers || 0}/32 initialized</div>
            <div>✅ System status: {verificationResults?.systemStatus || 'pending verification'}</div>
            <div>✅ Ready for tournament testing: {verificationResults?.isSystemReady ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <Button 
          onClick={completeSetup}
          disabled={!verificationResults}
          className="w-full"
        >
          <Users className="mr-2 h-4 w-4" />
          Complete Demo User Setup
        </Button>
      </div>
    </div>
  );
};