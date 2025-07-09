import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  icon: React.ComponentType<any>;
}

interface SystemHealthCardProps {
  systemStatus: 'healthy' | 'warning' | 'error';
  lastUpdated: string;
  metrics?: SystemMetric[];
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ 
  systemStatus, 
  lastUpdated,
  metrics = []
}) => {
  const { t } = useLanguage();

  const defaultMetrics: SystemMetric[] = [
    {
      name: 'Database',
      value: '< 100ms',
      status: 'healthy',
      icon: Database
    },
    {
      name: 'API Server',
      value: 'Online',
      status: 'healthy',
      icon: Server
    },
    {
      name: 'Network',
      value: '99.9%',
      status: 'healthy',
      icon: Wifi
    }
  ];

  const allMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return t('admin.system_healthy');
      case 'warning':
        return t('admin.system_warning');
      case 'error':
        return t('admin.system_error');
      default:
        return t('admin.system_unknown');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
      case 'error':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const StatusIcon = getStatusIcon(systemStatus);

  return (
    <Card className={systemStatus !== 'healthy' ? 'border-yellow-200 bg-yellow-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${
            systemStatus === 'healthy' ? 'text-green-600' : 
            systemStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`} />
          {t('admin.system_status')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus)}`}></div>
            <span className="font-medium">{getStatusText(systemStatus)}</span>
          </div>
          <Badge variant="outline">
            {t('admin.last_updated')}: {lastUpdated}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allMetrics.map((metric, index) => {
            const MetricIcon = metric.icon;
            return (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border"
              >
                <div className={`p-2 rounded-lg ${
                  metric.status === 'healthy' ? 'bg-green-100' :
                  metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <MetricIcon className={`w-4 h-4 ${
                    metric.status === 'healthy' ? 'text-green-600' :
                    metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <div className="font-medium text-sm">{metric.name}</div>
                  <div className="text-xs text-muted-foreground">{metric.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {t('admin.auto_refresh')}: 30s
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;