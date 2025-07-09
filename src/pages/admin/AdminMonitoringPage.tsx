import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { UserBehaviorAnalytics } from '@/components/analytics/UserBehaviorAnalytics';
import { PredictiveAnalyticsDashboard } from '@/components/predictive/PredictiveAnalyticsDashboard';
import { RecommendationEngine } from '@/components/ai/RecommendationEngine';
import { EngagementScoring } from '@/components/ai/EngagementScoring';
import { AlertAnalysisDashboard } from '@/components/alerts/AlertAnalysisDashboard';
import { ConversationalAlerts } from '@/components/alerts/ConversationalAlerts';
import { AutomatedReporting } from '@/components/alerts/AutomatedReporting';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Users, Brain, Lightbulb, Target, MessageSquare, FileText, Zap } from 'lucide-react';

export const AdminMonitoringPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive monitoring, analytics, and system insights for SABO Pool Arena
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

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive AI
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Alert Analysis
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringDashboard />
          
          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
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
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior">
          <UserBehaviorAnalytics />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network & Performance Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive">
          <PredictiveAnalyticsDashboard />
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations">
          <RecommendationEngine />
        </TabsContent>

        {/* Engagement Scoring Tab */}
        <TabsContent value="engagement">
          <EngagementScoring />
        </TabsContent>

        {/* Alert Analysis Tab */}
        <TabsContent value="alerts">
          <AlertAnalysisDashboard />
        </TabsContent>

        {/* Conversational AI Tab */}
        <TabsContent value="chat">
          <ConversationalAlerts />
        </TabsContent>

        {/* Automated Reports Tab */}
        <TabsContent value="reports">
          <AutomatedReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
};