import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConnectionQuality, usePerformanceMonitoring } from '@/hooks/useNetworkOptimization';
import { Activity, Wifi, Clock, Zap } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
}

export const PerformanceMonitor: React.FC = () => {
  const { data: networkQuality } = useConnectionQuality();
  const { measureQueryPerformance } = usePerformanceMonitoring();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    // Collect Core Web Vitals and other performance metrics
    const collectMetrics = () => {
      const newMetrics: PerformanceMetric[] = [];

      // Network Latency
      if (networkQuality) {
        newMetrics.push({
          name: 'Network Latency',
          value: networkQuality.latency,
          unit: 'ms',
          status: networkQuality.quality === 'excellent' || networkQuality.quality === 'good' ? 'good' :
                  networkQuality.quality === 'fair' ? 'warning' : 'poor'
        });
      }

      // Performance Navigation Timing
      if (performance.navigation) {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigationTiming) {
          // Page Load Time
          const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
          newMetrics.push({
            name: 'Page Load Time',
            value: pageLoadTime,
            unit: 'ms',
            status: pageLoadTime < 2000 ? 'good' : pageLoadTime < 4000 ? 'warning' : 'poor'
          });

          // Time to Interactive
          const tti = navigationTiming.domInteractive - navigationTiming.fetchStart;
          newMetrics.push({
            name: 'Time to Interactive',
            value: tti,
            unit: 'ms',
            status: tti < 1500 ? 'good' : tti < 3000 ? 'warning' : 'poor'
          });

          // First Contentful Paint (approximated)
          const fcp = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
          newMetrics.push({
            name: 'First Contentful Paint',
            value: fcp,
            unit: 'ms',
            status: fcp < 1000 ? 'good' : fcp < 2000 ? 'warning' : 'poor'
          });
        }
      }

      // Memory Usage (if available)
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        newMetrics.push({
          name: 'Memory Usage',
          value: memoryUsage,
          unit: '%',
          status: memoryUsage < 70 ? 'good' : memoryUsage < 85 ? 'warning' : 'poor'
        });
      }

      setMetrics(newMetrics);
    };

    collectMetrics();

    // Update metrics every 30 seconds
    const interval = setInterval(collectMetrics, 30000);
    return () => clearInterval(interval);
  }, [networkQuality]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return 'Excellent';
      case 'warning': return 'Needs Attention';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  const getNetworkIcon = () => {
    if (!networkQuality) return <Wifi className="w-4 h-4" />;
    
    switch (networkQuality.quality) {
      case 'excellent': return <Zap className="w-4 h-4 text-green-500" />;
      case 'good': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'fair': return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <Wifi className="w-4 h-4 text-red-500" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Quality */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <span className="font-medium">Network Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {networkQuality?.latency}ms
            </span>
            <Badge variant="outline" className="capitalize">
              {networkQuality?.quality || 'Testing...'}
            </Badge>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)}`} />
                <span className="font-medium">{metric.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {metric.value.toFixed(0)}{metric.unit}
                </span>
                <Badge 
                  variant={metric.status === 'good' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getStatusText(metric.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Tips */}
        {metrics.some(m => m.status !== 'good') && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-600">Performance Tips</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              {networkQuality?.quality === 'poor' && (
                <li>• Check your internet connection for better performance</li>
              )}
              {metrics.find(m => m.name === 'Memory Usage' && m.status !== 'good') && (
                <li>• Close unused browser tabs to free up memory</li>
              )}
              {metrics.find(m => m.name === 'Page Load Time' && m.status !== 'good') && (
                <li>• Consider refreshing the page or clearing browser cache</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};