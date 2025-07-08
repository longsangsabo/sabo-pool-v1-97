import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, UserCheck, UserX, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoUser {
  user_id: string;
  full_name: string;
  display_name: string;
  skill_level: string;
  elo: number;
  spa_points: number;
}

interface DemoUserStats {
  total_demo_users: number;
  available_users: number;
  in_use_users: number;
  usage_percentage: number;
}

interface DemoUserManagerProps {
  addLog?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const DemoUserManager: React.FC<DemoUserManagerProps> = ({ addLog }) => {
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [stats, setStats] = useState<DemoUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const log = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (addLog) {
      addLog(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  };

  const initializeDemoUsers = async () => {
    setIsInitializing(true);
    log('🔧 Initializing 32 demo users...');
    
    try {
      const { data, error } = await supabase.rpc('seed_demo_users');
      
      if (error) {
        log(`❌ Failed to seed demo users: ${error.message}`, 'error');
        toast.error('Failed to initialize demo users');
        return;
      }
      
      const result = data as { users_created: number; total_demo_users: number; message: string };
      log(`✅ ${result.users_created} new demo users created! Total: ${result.total_demo_users}`, 'success');
      toast.success(`Demo users initialized: ${result.users_created} new, ${result.total_demo_users} total`);
      
      await Promise.all([loadAvailableUsers(), loadStats()]);
    } catch (error: any) {
      log(`❌ Error initializing demo users: ${error.message}`, 'error');
      toast.error('Error initializing demo users');
    } finally {
      setIsInitializing(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_demo_users', {
        needed_count: 32
      });
      
      if (error) {
        log(`❌ Error loading demo users: ${error.message}`, 'error');
        return;
      }
      
      setDemoUsers(data || []);
      log(`📊 ${data?.length || 0} demo users available`);
    } catch (error: any) {
      log(`❌ Error loading demo users: ${error.message}`, 'error');
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_demo_user_stats');
      
      if (error) {
        log(`❌ Error loading stats: ${error.message}`, 'error');
        return;
      }
      
      setStats(data as unknown as DemoUserStats);
    } catch (error: any) {
      log(`❌ Error loading stats: ${error.message}`, 'error');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([loadAvailableUsers(), loadStats()]);
    setIsLoading(false);
  };

  const releaseAllDemoUsers = async () => {
    setIsLoading(true);
    log('🧹 Releasing all demo users...');
    
    try {
      const { data, error } = await supabase.rpc('release_demo_users', {
        tournament_id: 'all'
      });
      
      if (error) {
        log(`❌ Cleanup failed: ${error.message}`, 'error');
        toast.error('Failed to release demo users');
        return;
      }
      
      const result = data as { released_count: number; message: string };
      log(`✅ Released ${result.released_count} demo users`, 'success');
      toast.success(`Released ${result.released_count} demo users`);
      
      await refreshData();
    } catch (error: any) {
      log(`❌ Error releasing demo users: ${error.message}`, 'error');
      toast.error('Error releasing demo users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-red-100 text-red-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Demo User Pool</CardTitle>
              <CardDescription>32 pre-seeded users for tournament testing</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={initializeDemoUsers}
              disabled={isInitializing}
              variant="default"
              size="sm"
            >
              {isInitializing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Initialize Users
            </Button>
            <Button
              onClick={refreshData}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_demo_users}</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.available_users}</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">In Use</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.in_use_users}</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Usage</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.usage_percentage}%</div>
              <Progress value={stats.usage_percentage} className="mt-1" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={releaseAllDemoUsers} 
            disabled={isLoading}
            variant="outline" 
            size="sm"
          >
            🧹 Release All Demo Users
          </Button>
        </div>

        {/* Demo Users Grid */}
        {demoUsers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Available Demo Users (Top 8)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {demoUsers.slice(0, 8).map(user => (
                <div key={user.user_id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{user.display_name}</div>
                    <Badge className={getSkillLevelColor(user.skill_level)}>
                      {user.skill_level}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {user.full_name}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span>ELO: <strong>{user.elo}</strong></span>
                    <span>SPA: <strong>{user.spa_points}</strong></span>
                  </div>
                </div>
              ))}
              {demoUsers.length > 8 && (
                <div className="p-3 border rounded-lg text-center text-gray-500 bg-gray-100 dark:bg-gray-700">
                  <div className="text-sm font-medium">
                    +{demoUsers.length - 8} more users...
                  </div>
                  <div className="text-xs">
                    Total {demoUsers.length} available
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🎯 Demo User System Status
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>• 32 pre-configured Vietnamese users with realistic profiles</div>
            <div>• Mixed skill levels: Expert, Advanced, Intermediate</div>
            <div>• ELO ratings from 1010 to 1450 for balanced testing</div>
            <div>• Complete wallets and player rankings included</div>
            <div>• Ready for instant tournament population</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};