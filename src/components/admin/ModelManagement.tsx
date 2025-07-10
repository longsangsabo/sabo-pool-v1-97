import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Zap, Brain, Code, Star, AlertTriangle, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelSelector, GPT_MODELS } from '@/components/ModelSelector';
import { useToast } from '@/components/ui/use-toast';
import ModelTestingDemo from './ModelTestingDemo';
import AdminModelSettings from './AdminModelSettings';
import { getModelUsageStats, getOpenAIUsageStats, getAIAssistantStats } from '@/lib/openai-usage-tracker';
import { supabase } from '@/integrations/supabase/client';

interface ModelConfig {
  taskType: string;
  modelId: string;
  enabled: boolean;
  costLimit?: number;
}

interface UsageStats {
  modelId: string;
  requests: number;
  cost: number;
  avgResponseTime: number;
  successRate: number;
}

interface AIUsageOverview {
  assistant_type: string;
  model_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens: number;
  avg_response_time: number;
  unique_users: number;
  unique_sessions: number;
  success_rate: number;
}

const TASK_TYPES = [
  { id: 'translation', name: 'Translation', description: 'Dịch thuật tự động', icon: <Code className="w-4 h-4" /> },
  { id: 'alert_analysis', name: 'Alert Analysis', description: 'Phân tích cảnh báo hệ thống', icon: <Brain className="w-4 h-4" /> },
  { id: 'chat', name: 'Chat Queries', description: 'Trả lời chat và Q&A', icon: <Zap className="w-4 h-4" /> },
  { id: 'reasoning', name: 'Complex Reasoning', description: 'Phân tích phức tạp và dự đoán', icon: <Star className="w-4 h-4" /> }
];

// Mock data - trong thực tế sẽ lấy từ API
const mockUsageStats: UsageStats[] = [
  { modelId: 'gpt-4.1-2025-04-14', requests: 156, cost: 12.5, avgResponseTime: 2.3, successRate: 98.7 },
  { modelId: 'gpt-4.1-mini-2025-04-14', requests: 423, cost: 3.2, avgResponseTime: 1.1, successRate: 99.2 },
  { modelId: 'o3-2025-04-16', requests: 89, cost: 15.7, avgResponseTime: 4.2, successRate: 97.8 },
  { modelId: 'o4-mini-2025-04-16', requests: 234, cost: 6.8, avgResponseTime: 1.8, successRate: 98.9 }
];

const mockDefaultConfigs: ModelConfig[] = [
  { taskType: 'translation', modelId: 'gpt-4.1-mini-2025-04-14', enabled: true },
  { taskType: 'alert_analysis', modelId: 'o3-2025-04-16', enabled: true },
  { taskType: 'chat', modelId: 'gpt-4.1-2025-04-14', enabled: true },
  { taskType: 'reasoning', modelId: 'o3-2025-04-16', enabled: true }
];

const ModelManagement: React.FC = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<ModelConfig[]>(mockDefaultConfigs);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [aiUsageStats, setAiUsageStats] = useState<AIUsageOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  useEffect(() => {
    const fetchRealUsageData = async () => {
      try {
        setLoading(true);
        
        // Fetch OpenAI usage stats
        const [modelStats, rawLogs] = await Promise.all([
          getModelUsageStats(),
          getOpenAIUsageStats(30)
        ]);

        setUsageStats(modelStats);
        
        // Calculate totals from raw logs
        const totalCostValue = rawLogs.reduce((sum, log) => sum + log.cost_usd, 0);
        const totalRequestsValue = rawLogs.length;
        
        setTotalCost(totalCostValue);
        setTotalRequests(totalRequestsValue);

        // Fetch AI Assistant usage stats
        const aiAssistantStats = await getAIAssistantStats();
        setAiUsageStats(aiAssistantStats);

      } catch (error) {
        console.error('Failed to fetch usage data:', error);
        toast({
          title: "Cảnh báo",
          description: "Không thể tải dữ liệu thực tế, đang hiển thị dữ liệu mẫu",
          variant: "destructive",
        });
        // Fallback to mock data
        setUsageStats(mockUsageStats);
        setTotalCost(mockUsageStats.reduce((sum, stat) => sum + stat.cost, 0));
        setTotalRequests(mockUsageStats.reduce((sum, stat) => sum + stat.requests, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchRealUsageData();
  }, [toast]);

  const handleModelChange = (taskType: string, modelId: string) => {
    setConfigs(prev => prev.map(config => 
      config.taskType === taskType 
        ? { ...config, modelId }
        : config
    ));
  };

  const handleToggle = (taskType: string, enabled: boolean) => {
    setConfigs(prev => prev.map(config => 
      config.taskType === taskType 
        ? { ...config, enabled }
        : config
    ));
  };

  const saveConfigs = async () => {
    try {
      // TODO: Call API to save configs
      console.log('Saving configs:', configs);
      
      toast({
        title: "Cấu hình đã lưu",
        description: "Các thay đổi model đã được áp dụng",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cấu hình",
        variant: "destructive",
      });
    }
  };

  const getModelName = (modelId: string) => {
    return GPT_MODELS.find(m => m.id === modelId)?.name || modelId;
  };

  const getTotalCost = () => {
    return totalCost;
  };

  const getTotalRequests = () => {
    return totalRequests;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Model Management</h1>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          🔄 Refresh Data
        </Button>
      </div>

      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          Quản lý và cấu hình các AI models cho từng loại tác vụ. 
          Các thay đổi sẽ được áp dụng ngay lập tức cho tất cả Edge Functions.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Cấu hình Model</TabsTrigger>
          <TabsTrigger value="admin-settings">Admin Settings</TabsTrigger>
          <TabsTrigger value="analytics">OpenAI Models</TabsTrigger>
          <TabsTrigger value="ai-assistants">AI Assistants</TabsTrigger>
          <TabsTrigger value="testing">Test Models</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4">
            {TASK_TYPES.map((taskType) => {
              const config = configs.find(c => c.taskType === taskType.id);
              return (
                <Card key={taskType.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {taskType.icon}
                        {taskType.name}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config?.enabled || false}
                          onCheckedChange={(enabled) => handleToggle(taskType.id, enabled)}
                        />
                        <Label htmlFor={`toggle-${taskType.id}`}>Enabled</Label>
                      </div>
                    </CardTitle>
                    <CardDescription>{taskType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ModelSelector
                      value={config?.modelId}
                      onChange={(modelId) => handleModelChange(taskType.id, modelId)}
                      taskType={taskType.id as any}
                      showDetails={true}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveConfigs}>
              Lưu cấu hình
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="admin-settings" className="space-y-4">
          <AdminModelSettings />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {usageStats.length === 0 && !loading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Chưa có dữ liệu sử dụng thực tế. Dữ liệu sẽ được ghi lại khi các Edge Functions được sử dụng.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tổng số requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{getTotalRequests().toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">30 ngày qua</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tổng chi phí</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${getTotalCost().toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">30 ngày qua</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tỷ lệ thành công</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {usageStats.length > 0 ? (usageStats.reduce((sum, stat) => sum + stat.successRate, 0) / usageStats.length).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Trung bình</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết theo OpenAI Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageStats.map((stat) => {
                  const model = GPT_MODELS.find(m => m.id === stat.modelId);
                  return (
                    <div key={stat.modelId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {model?.icon}
                        <div>
                          <p className="font-medium">{model?.name}</p>
                          <p className="text-sm text-muted-foreground">{model?.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{stat.requests}</p>
                          <p className="text-muted-foreground">Requests</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">${stat.cost.toFixed(2)}</p>
                          <p className="text-muted-foreground">Cost</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{stat.avgResponseTime}s</p>
                          <p className="text-muted-foreground">Response</p>
                        </div>
                        <div className="text-center">
                          <Badge variant={stat.successRate > 98 ? "default" : "secondary"}>
                            {stat.successRate}%
                          </Badge>
                          <p className="text-muted-foreground">Success</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistants" className="space-y-4">
          {aiUsageStats.length === 0 && !loading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Chưa có dữ liệu sử dụng AI Assistant. Dữ liệu sẽ được ghi lại khi người dùng tương tác với AI Assistant.
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {aiUsageStats.length > 0 && (
            <>
              {/* Overall AI Assistant Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tổng requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {aiUsageStats.reduce((sum, stat) => sum + stat.total_requests, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">30 ngày qua</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tổng tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {aiUsageStats.reduce((sum, stat) => sum + stat.total_tokens, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Đã sử dụng</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Người dùng độc nhất</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {Math.max(...aiUsageStats.map(stat => stat.unique_users))}
                    </p>
                    <p className="text-xs text-muted-foreground">Tương tác</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thời gian phản hồi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {aiUsageStats.length > 0 ? 
                        (aiUsageStats.reduce((sum, stat) => sum + stat.avg_response_time, 0) / aiUsageStats.length).toFixed(1) 
                        : 0}ms
                    </p>
                    <p className="text-xs text-muted-foreground">Trung bình</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed AI Assistant Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết theo AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiUsageStats.map((stat, index) => (
                      <div key={`${stat.assistant_type}-${stat.model_name}-${index}`} 
                           className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {stat.assistant_type === 'user' ? 
                            <Users className="w-5 h-5 text-blue-600" /> : 
                            <Shield className="w-5 h-5 text-purple-600" />
                          }
                          <div>
                            <p className="font-medium">
                              {stat.assistant_type === 'user' ? 'User AI Assistant' : 'Admin AI Assistant'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Model: {stat.model_name}
                            </p>
                          </div>
                          <Badge variant={stat.assistant_type === 'user' ? 'default' : 'secondary'}>
                            {stat.assistant_type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-5 gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{stat.total_requests.toLocaleString()}</p>
                            <p className="text-muted-foreground">Requests</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{stat.total_tokens.toLocaleString()}</p>
                            <p className="text-muted-foreground">Tokens</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{stat.avg_response_time.toFixed(0)}ms</p>
                            <p className="text-muted-foreground">Response</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{stat.unique_users}</p>
                            <p className="text-muted-foreground">Users</p>
                          </div>
                          <div className="text-center">
                            <Badge variant={stat.success_rate > 95 ? "default" : "secondary"}>
                              {stat.success_rate.toFixed(1)}%
                            </Badge>
                            <p className="text-muted-foreground">Success</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <ModelTestingDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelManagement;