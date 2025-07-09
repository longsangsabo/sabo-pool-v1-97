import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export const AdminMonitoringPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for SABO Pool Arena
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-green-600">99.9%</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">234ms</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold text-orange-600">0.1%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Dashboard */}
      <MonitoringDashboard />

      {/* Performance Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Network & Performance Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceMonitor />
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '10:34 AM', event: 'Tournament "Monthly Championship" created', type: 'info' },
              { time: '10:28 AM', event: 'High memory usage detected (85%)', type: 'warning' },
              { time: '10:15 AM', event: 'Database backup completed successfully', type: 'success' },
              { time: '09:45 AM', event: 'API response time spike: 2.3s', type: 'warning' },
              { time: '09:30 AM', event: 'New user registration: John Doe', type: 'info' }
            ].map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  event.type === 'success' ? 'bg-green-500' :
                  event.type === 'warning' ? 'bg-yellow-500' :
                  event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm font-mono text-muted-foreground">{event.time}</span>
                <span className="text-sm">{event.event}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};