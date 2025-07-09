import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { PerformanceMetrics } from './PerformanceMetrics';
import { AlertAnalyzer } from './AlertAnalyzer';
// Temporarily disable CacheManager to fix React error
// import { CacheManager } from './CacheManager';
import MobileOptimizedTable from '@/components/mobile/MobileOptimizedTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  RefreshCw,
  Calendar,
  Settings,
  TrendingUp,
  Trophy,
  Bell,
  Play,
  Pause,
  Eye,
  Edit3,
  BarChart3,
  Zap,
  Timer,
  Server,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

interface SystemLog {
  id: string;
  log_type: string;
  message: string;
  metadata: any;
  created_at: string;
}

interface AutomationSummary {
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  lastRunTime: Date | null;
  nextScheduledRun: Date | null;
}

type JobStatus = 'Running' | 'Completed' | 'Paused' | 'Error' | 'Scheduled';

const AutomationMonitor = () => {
  const { user } = useAuth();
  // CRITICAL: All hooks MUST be called at the top level BEFORE any returns
  const { isMobile } = useMobileOptimization();
  
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  const loadAutomationData = async () => {
    try {
      // Get cron jobs
      const { data: jobs, error: jobsError } = await supabase
        .rpc('get_cron_jobs');
      
      if (jobsError) {
        console.error('Error fetching cron jobs:', jobsError);
      } else {
        setCronJobs(Array.isArray(jobs) ? jobs : []);
      }

      // Get system logs
      const { data: logs, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error fetching system logs:', logsError);
      } else {
        setSystemLogs(logs || []);
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast.error('Lỗi khi tải dữ liệu automation');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAutomationData();
  };

  const runHealthCheck = async () => {
    try {
      const { error } = await supabase.rpc('system_health_check');
      if (error) throw error;
      
      toast.success('Health check hoàn tất thành công');
      await loadAutomationData();
    } catch (error) {
      console.error('Error running health check:', error);
      toast.error('Lỗi khi chạy health check');
    }
  };

  const testAutomationFunction = async (functionName: string) => {
    try {
      let result;
      
      switch (functionName) {
        case 'reset_daily_challenges':
          result = await supabase.rpc('reset_daily_challenges');
          break;
        case 'decay_inactive_spa_points':
          result = await supabase.rpc('decay_inactive_spa_points');
          break;
        case 'cleanup_expired_challenges':
          result = await supabase.rpc('cleanup_expired_challenges');
          break;
        case 'update_weekly_leaderboard':
          result = await supabase.rpc('update_weekly_leaderboard');
          break;
        case 'send_monthly_reports':
          result = await supabase.rpc('send_monthly_reports');
          break;
        case 'automated_season_reset':
          result = await supabase.rpc('automated_season_reset');
          break;
        case 'auto_bracket_generation':
          result = await supabase.functions.invoke('auto-bracket-generation');
          break;
        case 'tournament_reminder_system':
          result = await supabase.functions.invoke('tournament-reminder-system');
          break;
        case 'match_scheduling_automation':
          result = await supabase.functions.invoke('match-scheduling-automation');
          break;
        case 'inactive_player_cleanup':
          result = await supabase.functions.invoke('inactive-player-cleanup');
          break;
        case 'auto_rank_promotion':
          result = await supabase.functions.invoke('auto-rank-promotion');
          break;
        case 'database_health_monitoring':
          result = await supabase.functions.invoke('database-health-monitoring');
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
      
      if (result.error) throw result.error;
      
      toast.success(`Chạy thử ${functionName} thành công`);
      await loadAutomationData();
    } catch (error) {
      console.error(`Error testing ${functionName}:`, error);
      toast.error(`Lỗi khi test function ${functionName}`);
    }
  };

  const openJobDetails = (job: CronJob) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  useEffect(() => {
    loadAutomationData();
    
    // Set up real-time updates
    const interval = setInterval(loadAutomationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getAutomationSummary = (): AutomationSummary => {
    const totalJobs = cronJobs.length;
    const activeJobs = cronJobs.filter(job => job.active).length;
    const failedJobs = systemLogs.filter(log => 
      log.log_type.includes('error') || log.message.toLowerCase().includes('error')
    ).length;
    
    const lastLog = systemLogs[0];
    const lastRunTime = lastLog ? new Date(lastLog.created_at) : null;
    
    return {
      totalJobs,
      activeJobs,
      failedJobs,
      lastRunTime,
      nextScheduledRun: new Date(Date.now() + 60 * 60 * 1000) // Mock next run in 1 hour
    };
  };

  const getJobStatusIcon = (active: boolean) => {
    return active ? (
      <CheckCircle className="w-4 h-4 text-success" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );
  };

  const getJobStatusBadge = (active: boolean): { variant: any, text: string, color: string } => {
    if (active) {
      return { variant: "default", text: "Hoạt động", color: "text-success" };
    }
    return { variant: "secondary", text: "Tạm dừng", color: "text-muted-foreground" };
  };

  const getLogTypeIcon = (logType: string) => {
    switch (logType) {
      case 'health_check':
        return <Activity className="w-4 h-4 text-primary" />;
      case 'points_decay':
        return <TrendingUp className="w-4 h-4 text-warning" />;
      case 'season_reset':
        return <Calendar className="w-4 h-4 text-secondary" />;
      case 'daily_reset':
        return <RefreshCw className="w-4 h-4 text-success" />;
      case 'challenge_cleanup':
        return <Settings className="w-4 h-4 text-muted-foreground" />;
      case 'auto_rank_promotion':
        return <Trophy className="w-4 h-4 text-primary" />;
      default:
        return <Database className="w-4 h-4 text-primary" />;
    }
  };

  const formatNextRun = (schedule: string) => {
    const scheduleMap: { [key: string]: string } = {
      '0 0 * * *': 'Hàng ngày lúc 00:00',
      '0 1 * * *': 'Hàng ngày lúc 01:00', 
      '0 2 * * 0': 'Chủ nhật lúc 02:00',
      '0 3 * * 1': 'Thứ hai lúc 03:00',
      '0 4 1 * *': 'Ngày 1 hàng tháng lúc 04:00',
      '0 5 1 */3 *': 'Ngày 1 hàng quý lúc 05:00',
      '0 6 * * *': 'Hàng ngày lúc 06:00',
      '0 * * * *': 'Hàng giờ'
    };
    
    return scheduleMap[schedule] || schedule;
  };

  const getJobDescription = (jobname: string) => {
    const descriptions: { [key: string]: string } = {
      'auto_rank_promotion': 'Tự động thăng hạng cho người chơi đạt tiêu chuẩn',
      'reset_daily_challenges': 'Reset thử thách hàng ngày cho tất cả người chơi',
      'decay_inactive_spa_points': 'Giảm điểm SPA cho người chơi không hoạt động',
      'cleanup_expired_challenges': 'Dọn dẹp các thử thách đã hết hạn',
      'update_weekly_leaderboard': 'Cập nhật bảng xếp hạng hàng tuần',
      'database_health_monitoring': 'Giám sát sức khỏe cơ sở dữ liệu',
      'tournament_reminder_system': 'Gửi nhắc nhở giải đấu',
      'auto_bracket_generation': 'Tự động tạo bảng đấu'
    };
    
    return descriptions[jobname] || 'Automation job của hệ thống';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Đang tải dữ liệu automation...</span>
        </div>
      </div>
    );
  }

  const summary = getAutomationSummary();

  // Note: isMobile is now defined at component top level

  return (
    <TooltipProvider>
      <div className={`space-y-4 lg:space-y-6 p-4 lg:p-6 ${isMobile ? 'max-w-full' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Automation Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Giám sát và quản lý các tác vụ tự động của hệ thống
            </p>
          </div>
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Làm mới dữ liệu</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={runHealthCheck}
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Health Check
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kiểm tra sức khỏe hệ thống</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng số Jobs
                </CardTitle>
                <Server className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.totalJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Các tác vụ tự động
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jobs Hoạt động
                </CardTitle>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.activeJobs}</div>
              <Progress value={(summary.activeJobs / summary.totalJobs) * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {((summary.activeJobs / summary.totalJobs) * 100).toFixed(1)}% đang hoạt động
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lỗi gần đây
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.failedJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trong 24h qua
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Chạy gần nhất
                </CardTitle>
                <Timer className="w-4 h-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-foreground">
                {summary.lastRunTime ? 
                  summary.lastRunTime.toLocaleString('vi-VN') : 
                  'Chưa có dữ liệu'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lần thực thi cuối
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="jobs" className="gap-2">
              <Settings className="w-4 h-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="cache" className="gap-2">
              <Database className="w-4 h-4" />
              Cache
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="functions" className="gap-2">
              <Zap className="w-4 h-4" />
              Functions
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {cronJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Không tìm thấy scheduled jobs</p>
                    <p className="text-sm">Hãy đảm bảo pg_cron đã được kích hoạt và jobs đã được tạo</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cronJobs.map((job) => {
                  const statusBadge = getJobStatusBadge(job.active);
                  
                  return (
                    <Card key={job.jobid} className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-border hover:border-primary/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getJobStatusIcon(job.active)}
                            <div>
                              <CardTitle className="text-lg">
                                {job.jobname || `Job ${job.jobid}`}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {getJobDescription(job.jobname)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusBadge.variant} className={statusBadge.color}>
                              {statusBadge.text}
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openJobDetails(job)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem chi tiết</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Lịch chạy:</span>
                            <p className="text-sm font-medium">{formatNextRun(job.schedule)}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Cron Expression:</span>
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{job.schedule}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Database:</span>
                            <p className="text-sm">{job.database}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            {systemLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Không có system logs</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {getLogTypeIcon(log.log_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium capitalize">
                              {log.log_type.replace('_', ' ')}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {log.message}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-primary hover:text-primary/80 transition-colors">
                                Xem chi tiết metadata
                              </summary>
                              <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Test Functions Tab */}
          <TabsContent value="functions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Test Automation Functions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Chạy thử các function tự động của hệ thống
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'reset_daily_challenges', icon: RefreshCw, label: 'Daily Challenge Reset', desc: 'Reset thử thách hàng ngày' },
                    { name: 'decay_inactive_spa_points', icon: TrendingUp, label: 'Points Decay', desc: 'Giảm điểm SPA người chơi không hoạt động' },
                    { name: 'cleanup_expired_challenges', icon: Settings, label: 'Challenge Cleanup', desc: 'Dọn dẹp thử thách hết hạn' },
                    { name: 'update_weekly_leaderboard', icon: BarChart3, label: 'Weekly Leaderboard', desc: 'Cập nhật bảng xếp hạng tuần' },
                    { name: 'send_monthly_reports', icon: Calendar, label: 'Monthly Reports', desc: 'Gửi báo cáo hàng tháng' },
                    { name: 'auto_bracket_generation', icon: Trophy, label: 'Auto Bracket Generation', desc: 'Tự động tạo bảng đấu' },
                    { name: 'tournament_reminder_system', icon: Bell, label: 'Tournament Reminders', desc: 'Nhắc nhở giải đấu' },
                    { name: 'match_scheduling_automation', icon: Calendar, label: 'Match Scheduling', desc: 'Tự động lên lịch trận đấu' },
                    { name: 'inactive_player_cleanup', icon: Users, label: 'Player Cleanup', desc: 'Dọn dẹp người chơi không hoạt động' },
                    { name: 'auto_rank_promotion', icon: TrendingUp, label: 'Auto Rank Promotion', desc: 'Tự động thăng hạng' },
                    { name: 'database_health_monitoring', icon: Database, label: 'Database Health Check', desc: 'Kiểm tra sức khỏe database' }
                  ].map((func) => {
                    const Icon = func.icon;
                    return (
                      <Tooltip key={func.name}>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => testAutomationFunction(func.name)}
                            variant="outline" 
                            className="w-full justify-start gap-3 h-auto p-3"
                          >
                            <Icon className="w-4 h-4 text-primary" />
                            <div className="text-left">
                              <div className="font-medium">{func.label}</div>
                              <div className="text-xs text-muted-foreground">{func.desc}</div>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{func.desc}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Functions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Các function quan trọng - sử dụng cẩn thận
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Cảnh báo quan trọng
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Function này sẽ ảnh hưởng đến dữ liệu thật của hệ thống
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => testAutomationFunction('automated_season_reset')}
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Test Season Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetrics />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <AlertAnalyzer />
          </TabsContent>

          {/* Cache Tab - TEMPORARILY DISABLED */}
          <TabsContent value="cache" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Cache Manager tạm thời bị vô hiệu hóa</p>
                  <p className="text-sm">Đang khắc phục lỗi React infinite render</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Job Details Modal */}
        <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Chi tiết Job: {selectedJob?.jobname || `Job ${selectedJob?.jobid}`}
              </DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trạng thái</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getJobStatusIcon(selectedJob.active)}
                      <span className={selectedJob.active ? 'text-success' : 'text-destructive'}>
                        {selectedJob.active ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Job ID</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedJob.jobid}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getJobDescription(selectedJob.jobname)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lịch chạy</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatNextRun(selectedJob.schedule)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Database</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedJob.database}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Command</label>
                  <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-auto">
                    {selectedJob.command}
                  </pre>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Play className="w-4 h-4" />
                    Chạy ngay
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Xem logs
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AutomationMonitor;