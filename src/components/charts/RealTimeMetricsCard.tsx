import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Languages,
  Zap,
  BarChart3
} from 'lucide-react';

interface RealTimeMetric {
  id: string;
  title: string;
  value: number;
  unit?: string;
  change?: number;
  status: 'active' | 'warning' | 'error' | 'success';
  trend: 'up' | 'down' | 'stable';
  target?: number;
  description?: string;
}

interface RealTimeMetricsCardProps {
  metrics: RealTimeMetric[];
  updateInterval?: number;
}

const RealTimeMetricsCard: React.FC<RealTimeMetricsCardProps> = ({ 
  metrics,
  updateInterval = 5000 
}) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setTimeout(() => {
        setLastUpdate(new Date());
        setIsUpdating(false);
      }, 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-3 h-3 text-gray-500" />;
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'ms') {
      return `${value}ms`;
    }
    if (unit === 's') {
      return `${value}s`;
    }
    return value.toLocaleString();
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Chỉ số thời gian thực
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs text-muted-foreground">
              Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <div 
              key={metric.id}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                isUpdating ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100'
              } ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium text-sm">{metric.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  {metric.change && (
                    <span className={`text-xs ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-2xl font-bold mb-1">
                {formatValue(metric.value, metric.unit)}
              </div>
              
              {metric.target && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tiến độ</span>
                    <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                </div>
              )}
              
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.description}
                </p>
              )}
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Languages className="w-4 h-4" />
              <span>Hệ thống dịch thuật hoạt động ổn định</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Auto-refresh {updateInterval / 1000}s
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetricsCard;