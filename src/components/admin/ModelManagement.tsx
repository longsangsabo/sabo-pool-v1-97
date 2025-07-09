import React, { useState } from 'react';
import { Settings, BarChart3, Zap, Brain, Code, Star } from 'lucide-react';
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
  const [usageStats] = useState<UsageStats[]>(mockUsageStats);

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
    return usageStats.reduce((sum, stat) => sum + stat.cost, 0);
  };

  const getTotalRequests = () => {
    return usageStats.reduce((sum, stat) => sum + stat.requests, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Model Management</h1>
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
          <TabsTrigger value="analytics">Thống kê sử dụng</TabsTrigger>
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
                  {(usageStats.reduce((sum, stat) => sum + stat.successRate, 0) / usageStats.length).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Trung bình</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết theo Model</CardTitle>
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

        <TabsContent value="testing" className="space-y-4">
          <ModelTestingDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelManagement;