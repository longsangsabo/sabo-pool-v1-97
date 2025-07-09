import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Cloud, 
  Database, 
  Globe, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock,
  BarChart3,
  MapPin,
  Camera,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APIService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  endpoint?: string;
  usage?: {
    current: number;
    limit: number;
    period: string;
  };
}

interface SyncLog {
  id: string;
  service: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  recordsProcessed?: number;
}

export function ExternalAPIManager() {
  const { toast } = useToast();
  const [services, setServices] = useState<APIService[]>([
    {
      id: 'weather',
      name: 'Thời tiết',
      description: 'API thông tin thời tiết cho các sự kiện ngoài trời',
      icon: <Cloud className="h-5 w-5" />,
      status: 'connected',
      lastSync: '5 phút trước',
      endpoint: 'https://api.openweathermap.org',
      usage: { current: 245, limit: 1000, period: 'ngày' }
    },
    {
      id: 'maps',
      name: 'Bản đồ',
      description: 'Tích hợp Google Maps cho vị trí câu lạc bộ',
      icon: <MapPin className="h-5 w-5" />,
      status: 'connected',
      lastSync: '15 phút trước',
      endpoint: 'https://maps.googleapis.com',
      usage: { current: 1250, limit: 5000, period: 'tháng' }
    },
    {
      id: 'analytics',
      name: 'Phân tích',
      description: 'Google Analytics cho theo dõi người dùng',
      icon: <BarChart3 className="h-5 w-5" />,
      status: 'connected',
      lastSync: '2 giờ trước',
      endpoint: 'https://analytics.google.com',
      usage: { current: 89000, limit: 100000, period: 'tháng' }
    },
    {
      id: 'sms',
      name: 'SMS Gateway',
      description: 'Gửi thông báo SMS qua Twilio',
      icon: <Smartphone className="h-5 w-5" />,
      status: 'error',
      lastSync: '1 ngày trước',
      endpoint: 'https://api.twilio.com',
      usage: { current: 156, limit: 500, period: 'tháng' }
    },
    {
      id: 'storage',
      name: 'Cloud Storage',
      description: 'Lưu trữ ảnh và video trên AWS S3',
      icon: <Database className="h-5 w-5" />,
      status: 'connected',
      lastSync: '30 phút trước',
      endpoint: 'https://s3.amazonaws.com',
      usage: { current: 2.5, limit: 10, period: 'GB' }
    },
    {
      id: 'ai',
      name: 'AI Vision',
      description: 'Phân tích ảnh và video với AI',
      icon: <Camera className="h-5 w-5" />,
      status: 'disconnected',
      endpoint: 'https://api.openai.com',
      usage: { current: 0, limit: 1000, period: 'requests' }
    }
  ]);

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      id: '1',
      service: 'Thời tiết',
      timestamp: '2024-01-15 14:30:00',
      status: 'success',
      message: 'Đồng bộ thành công dữ liệu thời tiết',
      recordsProcessed: 25
    },
    {
      id: '2',
      service: 'Bản đồ',
      timestamp: '2024-01-15 14:15:00',
      status: 'success',
      message: 'Cập nhật vị trí câu lạc bộ',
      recordsProcessed: 12
    },
    {
      id: '3',
      service: 'SMS Gateway',
      timestamp: '2024-01-14 18:45:00',
      status: 'error',
      message: 'Lỗi xác thực API key',
      recordsProcessed: 0
    }
  ]);

  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Đã kết nối';
      case 'error':
        return 'Lỗi';
      case 'disconnected':
        return 'Chưa kết nối';
      default:
        return status;
    }
  };

  const getUsagePercentage = (usage: APIService['usage']) => {
    if (!usage) return 0;
    return (usage.current / usage.limit) * 100;
  };

  const testConnection = async (serviceId: string) => {
    setIsTestingConnection(serviceId);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: 'connected', lastSync: 'Vừa xong' }
          : service
      ));
      
      toast({
        title: "Kết nối thành công",
        description: "API đã được kết nối và hoạt động bình thường"
      });
    } catch (error) {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, status: 'error' }
          : service
      ));
      
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối với API",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(null);
    }
  };

  const syncData = async (serviceId: string) => {
    try {
      // Call edge function for data sync
      const { data, error } = await supabase.functions.invoke('sync-external-data', {
        body: { serviceId }
      });

      if (error) throw error;

      // Add new sync log
      const newLog: SyncLog = {
        id: Date.now().toString(),
        service: services.find(s => s.id === serviceId)?.name || '',
        timestamp: new Date().toLocaleString('vi-VN'),
        status: 'success',
        message: 'Đồng bộ dữ liệu thành công',
        recordsProcessed: data.recordsProcessed || 0
      };

      setSyncLogs(prev => [newLog, ...prev.slice(0, 9)]);
      
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, lastSync: 'Vừa xong' }
          : service
      ));

      toast({
        title: "Đồng bộ thành công",
        description: `Đã xử lý ${data.recordsProcessed || 0} bản ghi`
      });
    } catch (error) {
      console.error('Sync error:', error);
      
      const errorLog: SyncLog = {
        id: Date.now().toString(),
        service: services.find(s => s.id === serviceId)?.name || '',
        timestamp: new Date().toLocaleString('vi-VN'),
        status: 'error',
        message: 'Lỗi đồng bộ dữ liệu',
        recordsProcessed: 0
      };

      setSyncLogs(prev => [errorLog, ...prev.slice(0, 9)]);
      
      toast({
        title: "Lỗi đồng bộ",
        description: "Không thể đồng bộ dữ liệu",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* API Services Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý API ngoài</CardTitle>
          <CardDescription>
            Kết nối và quản lý các dịch vụ API bên ngoài
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {service.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{service.name}</span>
                    {getStatusIcon(service.status)}
                    <Badge variant={
                      service.status === 'connected' ? 'default' :
                      service.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {getStatusText(service.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                  {service.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Đồng bộ lần cuối: {service.lastSync}
                    </p>
                  )}
                  {service.usage && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Sử dụng: {service.usage.current}/{service.usage.limit} {service.usage.period}</span>
                        <span>{getUsagePercentage(service.usage).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(service.usage)} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection(service.id)}
                  disabled={isTestingConnection === service.id}
                >
                  {isTestingConnection === service.id ? 'Đang kiểm tra...' : 'Kiểm tra'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => syncData(service.id)}
                  disabled={service.status !== 'connected'}
                >
                  Đồng bộ
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đồng bộ</CardTitle>
          <CardDescription>
            Nhật ký các lần đồng bộ dữ liệu với API ngoài
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {log.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{log.service}</p>
                    <p className="text-xs text-muted-foreground">{log.message}</p>
                    <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  {log.recordsProcessed !== undefined && (
                    <p className="text-sm font-medium">
                      {log.recordsProcessed} bản ghi
                    </p>
                  )}
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình API</CardTitle>
          <CardDescription>
            Cài đặt các thông số kết nối API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Khoảng thời gian đồng bộ (phút)</Label>
              <Input
                id="sync-interval"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (giây)</Label>
              <Input
                id="timeout"
                type="number"
                placeholder="30"
                defaultValue="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retry-attempts">Số lần thử lại</Label>
              <Input
                id="retry-attempts"
                type="number"
                placeholder="3"
                defaultValue="3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-size">Kích thước batch</Label>
              <Input
                id="batch-size"
                type="number"
                placeholder="100"
                defaultValue="100"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline">Hủy</Button>
            <Button>Lưu cấu hình</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}