import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelSelector, GPT_MODELS } from '@/components/ModelSelector';
import { useToast } from '@/components/ui/use-toast';

interface AdminModelSettings {
  autoRecommendations: boolean;
  costLimit: number;
  fallbackModel: string;
  performanceTracking: boolean;
  defaultModels: {
    translation: string;
    alert_analysis: string;
    chat: string;
    reasoning: string;
  };
  costThresholds: {
    daily: number;
    monthly: number;
  };
}

const defaultSettings: AdminModelSettings = {
  autoRecommendations: true,
  costLimit: 100,
  fallbackModel: 'gpt-4.1-mini-2025-04-14',
  performanceTracking: true,
  defaultModels: {
    translation: 'gpt-4.1-mini-2025-04-14',
    alert_analysis: 'o3-2025-04-16',
    chat: 'gpt-4.1-2025-04-14',
    reasoning: 'o3-2025-04-16'
  },
  costThresholds: {
    daily: 50,
    monthly: 1000
  }
};

const AdminModelSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminModelSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key: keyof AdminModelSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleDefaultModelChange = (taskType: keyof AdminModelSettings['defaultModels'], modelId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultModels: {
        ...prev.defaultModels,
        [taskType]: modelId
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // TODO: Save to database/API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
      setHasChanges(false);
      toast({
        title: "Cài đặt đã lưu",
        description: "Các thay đổi sẽ được áp dụng cho tất cả Edge Functions",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Reset thành công",
      description: "Đã khôi phục về cài đặt mặc định",
    });
  };

  const estimateMonthlyCost = () => {
    const { defaultModels } = settings;
    const modelCosts = {
      'gpt-4.1-2025-04-14': 0.005,
      'gpt-4.1-mini-2025-04-14': 0.001,
      'o3-2025-04-16': 0.015,
      'o4-mini-2025-04-16': 0.003,
      'gpt-4o-mini': 0.0015
    };
    
    // Estimate based on typical usage patterns
    const estimatedRequests = {
      translation: 1000,
      alert_analysis: 200,
      chat: 500,
      reasoning: 100
    };

    let totalCost = 0;
    Object.entries(defaultModels).forEach(([task, model]) => {
      const cost = modelCosts[model as keyof typeof modelCosts] || 0.002;
      const requests = estimatedRequests[task as keyof typeof estimatedRequests] || 100;
      totalCost += cost * requests;
    });

    return totalCost;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Admin Model Settings</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={!hasChanges || saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bạn có thay đổi chưa lưu. Nhấn "Lưu cài đặt" để áp dụng các thay đổi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>
              Cấu hình hành vi chung của hệ thống AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Recommendations</Label>
                <p className="text-sm text-muted-foreground">
                  Tự động đề xuất model tối ưu cho từng task
                </p>
              </div>
              <Switch
                checked={settings.autoRecommendations}
                onCheckedChange={(checked) => handleSettingChange('autoRecommendations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Performance Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Thu thập metrics hiệu suất và cost
                </p>
              </div>
              <Switch
                checked={settings.performanceTracking}
                onCheckedChange={(checked) => handleSettingChange('performanceTracking', checked)}
              />
            </div>

            <div className="space-y-3">
              <Label>Fallback Model</Label>
              <p className="text-sm text-muted-foreground">
                Model dự phòng khi model chính không khả dụng
              </p>
              <Select
                value={settings.fallbackModel}
                onValueChange={(value) => handleSettingChange('fallbackModel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GPT_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cost Management */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý chi phí</CardTitle>
            <CardDescription>
              Thiết lập giới hạn và cảnh báo chi phí
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Giới hạn chi phí hàng ngày ($)</Label>
              <Slider
                value={[settings.costThresholds.daily]}
                onValueChange={([value]) => handleSettingChange('costThresholds', {
                  ...settings.costThresholds,
                  daily: value
                })}
                max={200}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>$10</span>
                <span className="font-medium">${settings.costThresholds.daily}</span>
                <span>$200</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Giới hạn chi phí hàng tháng ($)</Label>
              <Slider
                value={[settings.costThresholds.monthly]}
                onValueChange={([value]) => handleSettingChange('costThresholds', {
                  ...settings.costThresholds,
                  monthly: value
                })}
                max={5000}
                min={100}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>$100</span>
                <span className="font-medium">${settings.costThresholds.monthly}</span>
                <span>$5000</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Chi phí dự kiến</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${estimateMonthlyCost().toFixed(2)}/tháng
              </p>
              <p className="text-xs text-muted-foreground">
                Dựa trên cấu hình hiện tại
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Models Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Models cho từng Task</CardTitle>
          <CardDescription>
            Cấu hình model mặc định sẽ được sử dụng cho từng loại tác vụ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(settings.defaultModels).map(([taskType, modelId]) => {
              const taskLabels = {
                translation: 'Translation',
                alert_analysis: 'Alert Analysis',
                chat: 'Chat Queries',
                reasoning: 'Complex Reasoning'
              };
              
              return (
                <div key={taskType} className="space-y-3">
                  <Label>{taskLabels[taskType as keyof typeof taskLabels]}</Label>
                  <ModelSelector
                    value={modelId}
                    onChange={(newModelId) => handleDefaultModelChange(taskType as keyof AdminModelSettings['defaultModels'], newModelId)}
                    taskType={taskType as any}
                    showDetails={false}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminModelSettings;