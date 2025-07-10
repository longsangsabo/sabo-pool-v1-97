import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Users, Trophy,
  TrendingUp, TrendingDown, BarChart3, PieChart, Calendar,
  Target, Zap, DollarSign, Medal, Award, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentDashboardProps {
  tournamentId: string;
}

interface DashboardStats {
  realTimeData: {
    ongoingMatches: number;
    waitingMatches: number;
    completedToday: number;
    activeParticipants: number;
  };
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }[];
  performanceMetrics: {
    avgMatchDuration: number;
    completionRate: number;
    noShowRate: number;
    disputeRate: number;
  };
}

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ tournamentId }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch matches
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      // Fetch recent match events
      const { data: events } = await supabase
        .from('match_events')
        .select(`
          *,
          tournament_matches!inner(tournament_id)
        `)
        .eq('tournament_matches.tournament_id', tournamentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (matches) {
        const dashboardData = processDashboardData(matches, events || []);
        setStats(dashboardData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (matches: any[], events: any[]): DashboardStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const ongoingMatches = matches.filter(m => m.status === 'in_progress').length;
    const waitingMatches = matches.filter(m => m.status === 'scheduled').length;
    const completedToday = matches.filter(m => 
      m.status === 'completed' && 
      new Date(m.updated_at) >= today
    ).length;

    // Generate alerts based on current state
    const alerts = [];
    if (ongoingMatches > 5) {
      alerts.push({
        type: 'warning' as const,
        message: `Có ${ongoingMatches} trận đấu đang diễn ra đồng thời`,
        timestamp: now.toISOString()
      });
    }
    if (waitingMatches > 10) {
      alerts.push({
        type: 'info' as const,
        message: `${waitingMatches} trận đấu đang chờ bắt đầu`,
        timestamp: now.toISOString()
      });
    }

    // Process recent activity from events
    const recentActivity = events.slice(0, 5).map(event => ({
      type: event.event_type,
      description: getEventDescription(event),
      timestamp: event.created_at,
      user: event.reported_by
    }));

    const completedMatches = matches.filter(m => m.status === 'completed');
    const avgMatchDuration = completedMatches.length > 0
      ? completedMatches.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) / completedMatches.length
      : 0;

    return {
      realTimeData: {
        ongoingMatches,
        waitingMatches,
        completedToday,
        activeParticipants: ongoingMatches * 2 // Estimate
      },
      alerts,
      recentActivity,
      performanceMetrics: {
        avgMatchDuration,
        completionRate: matches.length > 0 ? (completedMatches.length / matches.length) * 100 : 0,
        noShowRate: 2.3, // Mock data
        disputeRate: 1.1 // Mock data
      }
    };
  };

  const getEventDescription = (event: any): string => {
    switch (event.event_type) {
      case 'match_started':
        return 'Trận đấu bắt đầu';
      case 'match_completed':
        return 'Trận đấu kết thúc';
      case 'score_updated':
        return 'Cập nhật tỷ số';
      case 'player_substitution':
        return 'Thay đổi người chơi';
      default:
        return event.event_type;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Không thể tải dữ liệu dashboard</p>
            <Button onClick={handleRefresh} className="mt-2">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh and last update */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard thời gian thực</h2>
          <p className="text-sm text-muted-foreground">
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          Làm mới
        </Button>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang thi đấu</p>
                <p className="text-2xl font-bold text-green-600">{stats.realTimeData.ongoingMatches}</p>
              </div>
              <div className="relative">
                <Activity className="h-8 w-8 text-green-600" />
                {stats.realTimeData.ongoingMatches > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ bắt đầu</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.realTimeData.waitingMatches}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành hôm nay</p>
                <p className="text-2xl font-bold text-blue-600">{stats.realTimeData.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Thí sinh hoạt động</p>
                <p className="text-2xl font-bold text-purple-600">{stats.realTimeData.activeParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo & Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.alerts.length > 0 ? (
                stats.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'error' ? 'bg-red-50 border-red-400' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {alert.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString('vi-VN')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Không có cảnh báo nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Chỉ số hiệu suất
          </CardTitle>
          <CardDescription>
            Thống kê hoạt động của giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(stats.performanceMetrics.avgMatchDuration)}p
              </div>
              <p className="text-sm text-muted-foreground">Thời gian trung bình/trận</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Bình thường
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(stats.performanceMetrics.completionRate)}%
              </div>
              <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Tốt
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.performanceMetrics.noShowRate}%
              </div>
              <p className="text-sm text-muted-foreground">Tỷ lệ vắng mặt</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Thấp
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats.performanceMetrics.disputeRate}%
              </div>
              <p className="text-sm text-muted-foreground">Tỷ lệ tranh chấp</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Rất thấp
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Trophy className="h-6 w-6" />
              <span className="text-xs">Tạo trận đấu</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Quản lý thí sinh</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-xs">Xem báo cáo</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span className="text-xs">Cài đặt</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentDashboard;