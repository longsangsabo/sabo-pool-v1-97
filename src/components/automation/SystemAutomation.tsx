import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Mail,
  Trophy,
  Users,
  BarChart3
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'tournament' | 'ranking' | 'notification' | 'maintenance';
  enabled: boolean;
  trigger: string;
  action: string;
  frequency: string;
  lastRun?: string;
  nextRun?: string;
  successRate: number;
}

interface SystemTask {
  id: string;
  name: string;
  type: 'scheduled' | 'triggered' | 'manual';
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  details: string;
}

export function SystemAutomation() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Tự động tạo giải đấu cuối tuần',
      description: 'Tự động tạo giải đấu vào thứ 6 hàng tuần',
      category: 'tournament',
      enabled: true,
      trigger: 'Thứ 6 lúc 9:00 AM',
      action: 'Tạo giải đấu cuối tuần',
      frequency: 'Hàng tuần',
      lastRun: '2024-01-12 09:00',
      nextRun: '2024-01-19 09:00',
      successRate: 98
    },
    {
      id: '2',
      name: 'Cập nhật xếp hạng tự động',
      description: 'Tính toán và cập nhật xếp hạng hàng ngày',
      category: 'ranking',
      enabled: true,
      trigger: 'Hàng ngày lúc 1:00 AM',
      action: 'Cập nhật bảng xếp hạng',
      frequency: 'Hàng ngày',
      lastRun: '2024-01-15 01:00',
      nextRun: '2024-01-16 01:00',
      successRate: 100
    },
    {
      id: '3',
      name: 'Thông báo giải đấu sắp diễn ra',
      description: 'Gửi thông báo 1 ngày trước giải đấu',
      category: 'notification',
      enabled: true,
      trigger: '1 ngày trước giải đấu',
      action: 'Gửi thông báo push',
      frequency: 'Khi có sự kiện',
      lastRun: '2024-01-14 10:00',
      nextRun: 'Theo lịch giải đấu',
      successRate: 95
    },
    {
      id: '4',
      name: 'Dọn dẹp dữ liệu cũ',
      description: 'Xóa logs và dữ liệu tạm thời cũ',
      category: 'maintenance',
      enabled: true,
      trigger: 'Chủ nhật lúc 3:00 AM',
      action: 'Xóa dữ liệu > 90 ngày',
      frequency: 'Hàng tuần',
      lastRun: '2024-01-14 03:00',
      nextRun: '2024-01-21 03:00',
      successRate: 100
    }
  ]);

  const [systemTasks] = useState<SystemTask[]>([
    {
      id: '1',
      name: 'Đồng bộ dữ liệu player rankings',
      type: 'scheduled',
      status: 'running',
      progress: 75,
      startTime: '2024-01-15 14:30',
      estimatedCompletion: '2024-01-15 14:45',
      details: 'Đang xử lý 1,250/1,600 players'
    },
    {
      id: '2',
      name: 'Backup database hàng ngày',
      type: 'scheduled',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-15 02:00',
      details: 'Hoàn thành backup 2.5GB'
    },
    {
      id: '3',
      name: 'Gửi email thông báo giải đấu',
      type: 'triggered',
      status: 'pending',
      progress: 0,
      startTime: '2024-01-15 15:00',
      details: 'Chờ xử lý 450 emails'
    }
  ]);

  const toggleAutomation = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tournament': return <Trophy className="h-4 w-4" />;
      case 'ranking': return <BarChart3 className="h-4 w-4" />;
      case 'notification': return <Mail className="h-4 w-4" />;
      case 'maintenance': return <Bot className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tournament': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ranking': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'notification': return 'bg-green-100 text-green-800 border-green-300';
      case 'maintenance': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Automation Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Tự động hóa hệ thống</CardTitle>
              <CardDescription>
                Quản lý các quy tắc tự động và theo dõi tiến trình hệ thống
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Quy tắc tự động</TabsTrigger>
          <TabsTrigger value="tasks">Tác vụ hệ thống</TabsTrigger>
          <TabsTrigger value="monitoring">Giám sát</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {getCategoryIcon(rule.category)}
                      <div className="flex-1">
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {rule.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleAutomation(rule.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge className={getCategoryColor(rule.category)}>
                    {rule.category === 'tournament' && 'Giải đấu'}
                    {rule.category === 'ranking' && 'Xếp hạng'}
                    {rule.category === 'notification' && 'Thông báo'}
                    {rule.category === 'maintenance' && 'Bảo trì'}
                  </Badge>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trigger:</span>
                      <span>{rule.trigger}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tần suất:</span>
                      <span>{rule.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lần chạy cuối:</span>
                      <span>{rule.lastRun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lần chạy tiếp:</span>
                      <span>{rule.nextRun}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tỷ lệ thành công:</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={rule.successRate} className="w-16" />
                      <span className="text-sm font-medium">{rule.successRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tác vụ hệ thống đang chạy</CardTitle>
              <CardDescription>
                Theo dõi các tác vụ tự động và thủ công
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">{task.details}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant={
                            task.type === 'scheduled' ? 'default' :
                            task.type === 'triggered' ? 'secondary' : 'outline'
                          }>
                            {task.type === 'scheduled' && 'Định kỳ'}
                            {task.type === 'triggered' && 'Tự động'}
                            {task.type === 'manual' && 'Thủ công'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Bắt đầu: {task.startTime}
                          </span>
                          {task.estimatedCompletion && (
                            <span className="text-xs text-muted-foreground">
                              Hoàn thành dự kiến: {task.estimatedCompletion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Progress value={task.progress} className="w-20" />
                        <span className="text-sm font-medium">{task.progress}%</span>
                      </div>
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'running' ? 'secondary' :
                        task.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {task.status === 'completed' && 'Hoàn thành'}
                        {task.status === 'running' && 'Đang chạy'}
                        {task.status === 'failed' && 'Thất bại'}
                        {task.status === 'pending' && 'Chờ xử lý'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tác vụ hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">12</div>
                <p className="text-xs text-muted-foreground">+2 từ hôm qua</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tỷ lệ thành công</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">98.5%</div>
                <p className="text-xs text-muted-foreground">+0.3% so với tuần trước</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Thời gian tiết kiệm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">24h</div>
                <p className="text-xs text-muted-foreground">Tuần này</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thực thi</CardTitle>
              <CardDescription>
                Theo dõi hiệu suất các quy tắc tự động
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['09:00 - Tạo giải đấu cuối tuần (Thành công)',
                  '01:00 - Cập nhật xếp hạng (Thành công)', 
                  '03:00 - Dọn dẹp dữ liệu (Thành công)',
                  '10:00 - Gửi thông báo (Thành công)'
                ].map((log, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}