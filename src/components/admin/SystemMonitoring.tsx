import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Database, 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Wifi,
  TrendingUp,
  BarChart3,
  Zap,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RealtimeStatus from '@/components/RealtimeStatus';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: {
    connection: boolean;
    response_time: number;
    active_connections: number;
  };
  api: {
    response_time: number;
    error_rate: number;
    requests_per_minute: number;
  };
  realtime: {
    connected: boolean;
    channels: number;
    last_ping: Date | null;
  };
}

interface PerformanceMetrics {
  tournaments: {
    active: number;
    completed_today: number;
    avg_duration: number;
  };
  users: {
    online: number;
    registrations_today: number;
    active_sessions: number;
  };
  matches: {
    completed_today: number;
    avg_completion_time: number;
    disputed: number;
  };
}

const SystemMonitoring: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchSystemHealth = async () => {
    try {
      // Test database connection and get response time
      const dbStart = Date.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const dbResponseTime = Date.now() - dbStart;

      // Get basic stats
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('status')
        .in('status', ['ongoing', 'registration_open']);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { data: matchesData } = await supabase
        .from('matches')
        .select('status, created_at, updated_at')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Simulate API metrics (in real app, these would come from monitoring service)
      const mockApiMetrics = {
        response_time: Math.floor(Math.random() * 50) + 50, // 50-100ms
        error_rate: Math.random() * 2, // 0-2%
        requests_per_minute: Math.floor(Math.random() * 100) + 200 // 200-300 RPM
      };

      const healthData: SystemHealth = {
        status: dbError ? 'critical' : dbResponseTime > 1000 ? 'warning' : 'healthy',
        database: {
          connection: !dbError,
          response_time: dbResponseTime,
          active_connections: Math.floor(Math.random() * 10) + 5 // Mock data
        },
        api: mockApiMetrics,
        realtime: {
          connected: realtimeConnected,
          channels: Math.floor(Math.random() * 20) + 10,
          last_ping: new Date()
        }
      };

      const metricsData: PerformanceMetrics = {
        tournaments: {
          active: tournamentsData?.length || 0,
          completed_today: Math.floor(Math.random() * 5) + 2,
          avg_duration: Math.floor(Math.random() * 60) + 120 // minutes
        },
        users: {
          online: Math.floor(Math.random() * 50) + 20,
          registrations_today: usersData?.length || 0,
          active_sessions: Math.floor(Math.random() * 30) + 15
        },
        matches: {
          completed_today: matchesData?.filter(m => m.status === 'completed').length || 0,
          avg_completion_time: Math.floor(Math.random() * 30) + 45, // minutes
          disputed: Math.floor(Math.random() * 3)
        }
      };

      setHealth(healthData);
      setMetrics(metricsData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast.error('Lỗi khi tải dữ liệu hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime monitoring
  useEffect(() => {
    const channel = supabase
      .channel('system-monitoring')
      .on('system', { event: 'ping' }, () => {
        setRealtimeConnected(true);
      })
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial load and periodic updates
  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [realtimeConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">System Health Monitoring</h2>
        </div>
        <RealtimeStatus 
          isConnected={realtimeConnected} 
          lastUpdate={lastUpdate} 
        />
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(health?.status || 'healthy')}
                <span className="text-sm font-medium">Overall Status</span>
              </div>
              <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                {health?.status?.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="text-lg font-bold">
              {health?.database.response_time}ms
            </div>
            <div className="text-xs text-muted-foreground">
              {health?.database.active_connections} connections
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">API</span>
            </div>
            <div className="text-lg font-bold">
              {health?.api.response_time}ms
            </div>
            <div className="text-xs text-muted-foreground">
              {health?.api.error_rate.toFixed(2)}% errors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Realtime</span>
            </div>
            <div className="text-lg font-bold">
              {health?.realtime.channels} channels
            </div>
            <div className="text-xs text-muted-foreground">
              {realtimeConnected ? 'Connected' : 'Disconnected'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tournament Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tournament Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Tournaments</span>
              <span className="text-2xl font-bold">{metrics?.tournaments.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed Today</span>
              <span className="text-lg font-semibold">{metrics?.tournaments.completed_today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Duration</span>
              <span className="text-lg font-semibold">{metrics?.tournaments.avg_duration}min</span>
            </div>
          </CardContent>
        </Card>

        {/* User Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Online Users</span>
              <span className="text-2xl font-bold text-green-500">{metrics?.users.online}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Today</span>
              <span className="text-lg font-semibold">{metrics?.users.registrations_today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className="text-lg font-semibold">{metrics?.users.active_sessions}</span>
            </div>
          </CardContent>
        </Card>

        {/* Match Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Match Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed Today</span>
              <span className="text-2xl font-bold">{metrics?.matches.completed_today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Time</span>
              <span className="text-lg font-semibold">{metrics?.matches.avg_completion_time}min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Disputed</span>
              <span className={`text-lg font-semibold ${metrics?.matches.disputed === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                {metrics?.matches.disputed}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {health?.status !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {health?.status === 'warning' 
              ? 'System is experiencing minor issues. Performance may be affected.'
              : 'Critical system issues detected. Immediate attention required.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Database Performance</span>
              <span>{health?.database.response_time}ms</span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (health?.database.response_time || 0) / 10)} 
              className="h-2" 
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>API Response Time</span>
              <span>{health?.api.response_time}ms</span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (health?.api.response_time || 0) / 5)} 
              className="h-2" 
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>System Reliability</span>
              <span>{(100 - (health?.api.error_rate || 0)).toFixed(1)}%</span>
            </div>
            <Progress 
              value={100 - (health?.api.error_rate || 0)} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoring;