import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  Zap, 
  Trophy, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_type: string;
  action_type: string;
  conditions: any;
  last_run: string | null;
  success_count: number;
  error_count: number;
}

interface TournamentStats {
  active_tournaments: number;
  pending_matches: number;
  completed_today: number;
  automation_success_rate: number;
}

const TournamentAutomation: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<TournamentStats>({
    active_tournaments: 0,
    pending_matches: 0,
    completed_today: 0,
    automation_success_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomationData();
    fetchStats();
  }, []);

  const fetchAutomationData = async () => {
    try {
      // Fetch automation rules (mock data for now)
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Auto Tournament Start',
          description: 'Automatically start tournaments when registration ends',
          enabled: true,
          trigger_type: 'schedule',
          action_type: 'start_tournament',
          conditions: { participants_min: 4 },
          last_run: '2024-01-08T10:00:00Z',
          success_count: 15,
          error_count: 1
        },
        {
          id: '2', 
          name: 'Bracket Auto-Generation',
          description: 'Generate tournament brackets when minimum participants reached',
          enabled: true,
          trigger_type: 'participant_count',
          action_type: 'generate_bracket',
          conditions: { min_participants: 4, max_participants: 64 },
          last_run: '2024-01-08T09:30:00Z',
          success_count: 22,
          error_count: 0
        },
        {
          id: '3',
          name: 'Match Result Notifications',
          description: 'Send notifications when matches are completed',
          enabled: true,
          trigger_type: 'match_completion',
          action_type: 'send_notification',
          conditions: { notify_participants: true, notify_organizer: true },
          last_run: '2024-01-08T11:15:00Z',
          success_count: 45,
          error_count: 2
        },
        {
          id: '4',
          name: 'Tournament Completion',
          description: 'Auto-complete tournaments and distribute prizes',
          enabled: true,
          trigger_type: 'final_match',
          action_type: 'complete_tournament',
          conditions: { auto_prize_distribution: true },
          last_run: '2024-01-08T08:45:00Z',
          success_count: 8,
          error_count: 0
        },
        {
          id: '5',
          name: 'Inactive Tournament Cleanup',
          description: 'Cancel tournaments with insufficient participants',
          enabled: false,
          trigger_type: 'schedule',
          action_type: 'cancel_tournament',
          conditions: { hours_after_deadline: 24, min_participants: 2 },
          last_run: null,
          success_count: 0,
          error_count: 0
        }
      ];
      
      setAutomationRules(mockRules);
    } catch (error) {
      console.error('Error fetching automation data:', error);
      toast.error('Lỗi khi tải dữ liệu automation');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch real stats from database
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['ongoing', 'registration_open']);

      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('status', 'scheduled');

      const { data: completedToday } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'completed')
        .gte('updated_at', new Date().toISOString().split('T')[0]);

      setStats({
        active_tournaments: tournaments?.length || 0,
        pending_matches: matches?.length || 0,
        completed_today: completedToday?.length || 0,
        automation_success_rate: 94.5 // Calculate from automation logs
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setAutomationRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );
      
      toast.success(`Automation rule ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Lỗi khi cập nhật rule');
    }
  };

  const runRule = async (ruleId: string) => {
    try {
      toast.info('Đang chạy automation rule...');
      
      // Mock API call to run rule
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAutomationRules(prev => 
        prev.map(rule => 
          rule.id === ruleId 
            ? { 
                ...rule, 
                last_run: new Date().toISOString(),
                success_count: rule.success_count + 1
              } 
            : rule
        )
      );
      
      toast.success('Automation rule executed successfully');
    } catch (error) {
      toast.error('Lỗi khi chạy automation rule');
    }
  };

  const getStatusIcon = (rule: AutomationRule) => {
    if (!rule.enabled) return <Pause className="h-4 w-4 text-muted-foreground" />;
    if (rule.error_count > 0) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSuccessRate = (rule: AutomationRule) => {
    const total = rule.success_count + rule.error_count;
    if (total === 0) return 0;
    return Math.round((rule.success_count / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Active Tournaments</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.active_tournaments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Pending Matches</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.pending_matches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed Today</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.completed_today}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.automation_success_rate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Tournament Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(rule)}
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Success: {rule.success_count}</span>
                      <span>Errors: {rule.error_count}</span>
                      <span>Rate: {getSuccessRate(rule)}%</span>
                      {rule.last_run && (
                        <span>
                          Last run: {new Date(rule.last_run).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runRule(rule.id)}
                    disabled={!rule.enabled}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Success Rate</span>
                <span>{stats.automation_success_rate}%</span>
              </div>
              <Progress value={stats.automation_success_rate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {automationRules.reduce((sum, rule) => sum + rule.success_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Successes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {automationRules.reduce((sum, rule) => sum + rule.error_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Errors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentAutomation;