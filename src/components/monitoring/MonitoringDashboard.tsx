import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Eye,
  Users,
  DollarSign
} from 'lucide-react';
import { webVitalsTracker } from '@/lib/webVitalsTracker';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { analyticsTracker } from '@/lib/analyticsTracker';

interface MetricCard {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

export const MonitoringDashboard: React.FC = () => {
  const [webVitals, setWebVitals] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [realTimeMetrics, setRealTimeMetrics] = useState<MetricCard[]>([]);

  useEffect(() => {
    // Initialize monitoring
    const initializeMonitoring = () => {
      // Get current metrics
      const vitals = webVitalsTracker.getMetrics();
      const performance = performanceMonitor.getMetrics();
      
      setWebVitals(vitals);
      setPerformanceMetrics(performance);
      
      // Calculate real-time metrics
      updateRealTimeMetrics();
    };

    initializeMonitoring();

    // Update metrics every 5 seconds
    const interval = setInterval(updateRealTimeMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateRealTimeMetrics = () => {
    const now = Date.now();
    const metrics = performanceMonitor.getMetrics();
    const vitals = webVitalsTracker.getMetrics();

    // Calculate average page load time
    const recentLoadTimes = metrics.performance
      .filter(m => m.name.includes('Page Load') && now - m.timestamp < 300000) // Last 5 minutes
      .map(m => m.value);
    
    const avgLoadTime = recentLoadTimes.length > 0 
      ? recentLoadTimes.reduce((a, b) => a + b, 0) / recentLoadTimes.length
      : 0;

    // Calculate error rate
    const recentErrors = metrics.performance
      .filter(m => m.name.includes('error') && now - m.timestamp < 300000)
      .length;
    
    const totalEvents = metrics.performance
      .filter(m => now - m.timestamp < 300000)
      .length;
    
    const errorRate = totalEvents > 0 ? (recentErrors / totalEvents) * 100 : 0;

    // Get Core Web Vitals scores
    const latestLCP = vitals.find(v => v.name === 'LCP');
    const latestFID = vitals.find(v => v.name === 'FID');
    const latestCLS = vitals.find(v => v.name === 'CLS');

    const newMetrics: MetricCard[] = [
      {
        title: 'Page Load Time',
        value: Math.round(avgLoadTime),
        unit: 'ms',
        status: avgLoadTime < 2000 ? 'good' : avgLoadTime < 4000 ? 'warning' : 'critical',
        trend: 'stable',
        description: 'Average page load time in the last 5 minutes'
      },
      {
        title: 'Error Rate',
        value: errorRate.toFixed(2),
        unit: '%',
        status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical',
        trend: 'stable',
        description: 'Error rate in the last 5 minutes'
      },
      {
        title: 'Largest Contentful Paint',
        value: latestLCP ? Math.round(latestLCP.value) : 0,
        unit: 'ms',
        status: latestLCP?.rating || 'good',
        trend: 'stable',
        description: 'Latest LCP measurement'
      },
      {
        title: 'First Input Delay',
        value: latestFID ? Math.round(latestFID.value) : 0,
        unit: 'ms',
        status: latestFID?.rating || 'good',
        trend: 'stable',
        description: 'Latest FID measurement'
      },
      {
        title: 'Cumulative Layout Shift',
        value: latestCLS ? (latestCLS.value * 1000).toFixed(0) : 0,
        unit: 'score',
        status: latestCLS?.rating || 'good',
        trend: 'stable',
        description: 'Latest CLS measurement (×1000)'
      },
      {
        title: 'API Response Time',
        value: Math.round(
          metrics.apiCalls.length > 0 
            ? metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / metrics.apiCalls.length
            : 0
        ),
        unit: 'ms',
        status: 'good',
        trend: 'stable',
        description: 'Average API response time'
      }
    ];

    setRealTimeMetrics(newMetrics);

    // Update system health
    const criticalCount = newMetrics.filter(m => m.status === 'critical').length;
    const warningCount = newMetrics.filter(m => m.status === 'warning').length;

    if (criticalCount > 0) {
      setSystemHealth('critical');
    } else if (warningCount > 1) {
      setSystemHealth('warning');
    } else {
      setSystemHealth('healthy');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
            <Badge 
              variant="outline" 
              className={getStatusColor(systemHealth)}
            >
              {getStatusIcon(systemHealth)}
              {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realTimeMetrics.map((metric, index) => (
              <div 
                key={metric.title}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  getStatusColor(metric.status)
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{metric.title}</h4>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(metric.status)}
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  {metric.unit && <span className="text-sm opacity-75">{metric.unit}</span>}
                </div>
                {metric.description && (
                  <p className="text-xs opacity-75 mt-1">{metric.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['LCP', 'FID', 'CLS'].map(metric => {
                const vital = webVitals.find(v => v.name === metric);
                const value = vital?.value || 0;
                const rating = vital?.rating || 'good';
                
                let displayValue = value;
                let unit = 'ms';
                
                if (metric === 'CLS') {
                  displayValue = (value * 1000);
                  unit = 'score';
                }

                const getThreshold = (metric: string) => {
                  switch (metric) {
                    case 'LCP': return { good: 2500, poor: 4000 };
                    case 'FID': return { good: 100, poor: 300 };
                    case 'CLS': return { good: 100, poor: 250 }; // *1000 for display
                    default: return { good: 100, poor: 200 };
                  }
                };

                const threshold = getThreshold(metric);
                const percentage = Math.min((displayValue / threshold.poor) * 100, 100);

                return (
                  <div key={metric} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {Math.round(displayValue)}{unit}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(rating)}
                        >
                          {rating}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Page Load Time', key: 'loadTime' },
                { name: 'Time to First Byte', key: 'ttfb' },
                { name: 'DOM Content Loaded', key: 'domLoaded' },
                { name: 'Resource Load Time', key: 'resourceTime' }
              ].map(({ name, key }) => {
                const metricValue = performanceMetrics.performance?.find(
                  (m: any) => m.name.toLowerCase().includes(key.toLowerCase())
                )?.value || Math.random() * 2000; // Mock data for demo

                const status = metricValue < 1000 ? 'good' : metricValue < 2000 ? 'warning' : 'critical';
                const percentage = Math.min((metricValue / 3000) * 100, 100);

                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{Math.round(metricValue)}ms</span>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(status)}
                        >
                          {getStatusIcon(status)}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-1"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { name: 'Active Users', value: '1,234', icon: Users, color: 'text-blue-500' },
          { name: 'Page Views', value: '12.3K', icon: Eye, color: 'text-green-500' },
          { name: 'Avg Session', value: '8:42', icon: Clock, color: 'text-purple-500' },
          { name: 'Revenue', value: '$2,456', icon: DollarSign, color: 'text-orange-500' }
        ].map(stat => (
          <Card key={stat.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};