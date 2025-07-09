import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Languages, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  BarChart,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { translationService, useAutoTranslation } from '@/services/translationService';
import { supabase } from '@/integrations/supabase/client';

interface TranslationStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  lastTranslated: string | null;
}

interface TranslationTask {
  id: string;
  page_path: string;
  component_name: string;
  source_language: string;
  target_language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

const AutoTranslationWorkflow: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<TranslationStats>({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    lastTranslated: null
  });
  const [tasks, setTasks] = useState<TranslationTask[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { batchTranslate, manualTranslate } = useAutoTranslation();

  useEffect(() => {
    loadStats();
    loadTasks();
    
    // Setup realtime listener for translation tasks
    const channel = supabase
      .channel('translation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translation_tasks'
        },
        () => {
          loadStats();
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await translationService.getTranslationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('translation_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Lỗi khi tải tasks:', error);
    }
  };

  const startAutoTranslation = async () => {
    setIsRunning(true);
    setLoading(true);
    toast.info('🚀 Bắt đầu workflow dịch thuật tự động');

    try {
      await batchTranslate();
      toast.success('✅ Workflow dịch thuật hoàn thành');
    } catch (error) {
      console.error('Lỗi workflow:', error);
      toast.error('❌ Lỗi trong quá trình dịch thuật');
    } finally {
      setIsRunning(false);
      setLoading(false);
    }
  };

  const pauseAutoTranslation = () => {
    setIsRunning(false);
    toast.info('⏸️ Đã tạm dừng workflow dịch thuật');
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadTasks()]);
    setLoading(false);
    toast.success('🔄 Đã cập nhật dữ liệu');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Chờ xử lý</Badge>;
      case 'processing':
        return <Badge variant="default"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Đang xử lý</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Hoàn thành</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Workflow Dịch Thuật Tự Động</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          {isRunning ? (
            <Button
              variant="secondary"
              onClick={pauseAutoTranslation}
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Tạm dừng
            </Button>
          ) : (
            <Button
              onClick={startAutoTranslation}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              Bắt đầu dịch
            </Button>
          )}
        </div>
      </div>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription>
          <strong>Workflow tự động:</strong> Hệ thống sẽ tự động phát hiện trang mới và dịch thuật các nội dung cần thiết.
          Sử dụng AI (OpenAI) để dịch thuật chính xác và phù hợp với bối cảnh bi-a.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="tasks">Tasks dịch thuật</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          <TabsTrigger value="manual">Dịch thủ công</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Tasks</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Tất cả tasks dịch thuật
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks đang chờ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Dịch thành công
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Cần xử lý lại
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Trạng thái Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Trạng thái:</span>
                  <Badge variant={isRunning ? "default" : "secondary"}>
                    {isRunning ? "Đang chạy" : "Đã dừng"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lần dịch cuối:</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.lastTranslated ? formatDate(stats.lastTranslated) : 'Chưa có'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tỷ lệ thành công:</span>
                  <span className="text-sm">
                    {stats.totalTasks > 0 
                      ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử Tasks Dịch Thuật</CardTitle>
              <CardDescription>
                Theo dõi tiến trình dịch thuật cho từng trang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có tasks dịch thuật nào
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{task.page_path}</div>
                        <div className="text-sm text-muted-foreground">
                          Component: {task.component_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.source_language.toUpperCase()} → {task.target_language.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(task.status)}
                        <div className="text-xs text-muted-foreground">
                          {formatDate(task.updated_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Cần thiết lập OpenAI API key trong Supabase Edge Function Secrets để sử dụng tính năng dịch thuật AI.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Tính năng tự động:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Phát hiện trang mới tự động</li>
                  <li>Trích xuất keys dịch thuật từ component</li>
                  <li>Dịch thuật thông minh với AI</li>
                  <li>Cập nhật từ điển dịch thuật real-time</li>
                  <li>Theo dõi và báo cáo tiến trình</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dịch Thuật Thủ Công</CardTitle>
              <CardDescription>
                Dịch thuật các trang cụ thể theo yêu cầu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => manualTranslate('/admin/tournaments', 'AdminTournaments')}
                >
                  Dịch trang Quản lý Giải đấu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => manualTranslate('/tournaments', 'TournamentsPage')}
                >
                  Dịch trang Giải đấu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => manualTranslate('/admin/users', 'AdminUsers')}
                >
                  Dịch trang Quản lý User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => manualTranslate('/admin/development', 'DevelopmentTools')}
                >
                  Dịch trang Dev Tools
                </Button>
              </div>
              
              <Alert>
                <AlertDescription>
                  <strong>Lưu ý:</strong> Dịch thuật thủ công sẽ ghi đè các bản dịch hiện có. 
                  Hãy chắc chắn trước khi thực hiện.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoTranslationWorkflow;