import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MousePointer, 
  Clock, 
  Navigation, 
  Target, 
  Users, 
  TrendingUp,
  Eye,
  MapPin,
  Smartphone,
  Monitor
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  actions: UserAction[];
  deviceType: string;
  browser: string;
  country: string;
}

interface UserAction {
  type: 'click' | 'navigation' | 'form_submit' | 'scroll' | 'hover';
  target: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface HeatmapData {
  element: string;
  clicks: number;
  position: { x: number; y: number };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#82ca9d', '#ffc658'];

export const UserBehaviorAnalytics: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserBehaviorData();
  }, [selectedTimeframe]);

  const fetchUserBehaviorData = async () => {
    setLoading(true);
    try {
      const timeframeMap = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const daysBack = timeframeMap[selectedTimeframe as keyof typeof timeframeMap] || 7;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);

      // Fetch analytics events
      const { data: events } = await supabase
        .from('analytics_events' as any)
        .select('*')
        .gte('timestamp', fromDate.toISOString())
        .order('timestamp', { ascending: true });

      if (events) {
        const processedSessions = processSessionData(events);
        setSessions(processedSessions);
        
        const heatmap = generateHeatmapData(events);
        setHeatmapData(heatmap);
      }
    } catch (error) {
      console.error('Error fetching user behavior data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSessionData = (events: any[]): UserSession[] => {
    const sessionMap = new Map<string, UserSession>();

    events.forEach(event => {
      const sessionId = event.session_id;
      if (!sessionId) return;

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          id: sessionId,
          userId: event.user_id,
          startTime: new Date(event.timestamp),
          duration: 0,
          pageViews: 0,
          actions: [],
          deviceType: getDeviceType(event.properties?.user_agent || ''),
          browser: getBrowser(event.properties?.user_agent || ''),
          country: event.properties?.country || 'Unknown'
        });
      }

      const session = sessionMap.get(sessionId)!;
      
      // Update session data
      session.endTime = new Date(event.timestamp);
      session.duration = session.endTime.getTime() - session.startTime.getTime();
      
      if (event.event_name === 'page_view') {
        session.pageViews++;
      }

      // Add action
      session.actions.push({
        type: getActionType(event.event_name),
        target: event.properties?.path || event.url || 'unknown',
        timestamp: new Date(event.timestamp),
        metadata: event.properties
      });
    });

    return Array.from(sessionMap.values());
  };

  const generateHeatmapData = (events: any[]): HeatmapData[] => {
    const clickEvents = events.filter(e => e.event_name === 'button_click' || e.event_name === 'link_click');
    const heatmapMap = new Map<string, number>();

    clickEvents.forEach(event => {
      const element = event.properties?.button_text || event.properties?.text || event.properties?.href || 'Unknown';
      heatmapMap.set(element, (heatmapMap.get(element) || 0) + 1);
    });

    return Array.from(heatmapMap.entries()).map(([element, clicks], index) => ({
      element,
      clicks,
      position: { x: Math.random() * 100, y: Math.random() * 100 } // Mock positions
    }));
  };

  const getDeviceType = (userAgent: string): string => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
    if (/Tablet/.test(userAgent)) return 'Tablet';
    return 'Desktop';
  };

  const getBrowser = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getActionType = (eventName: string): UserAction['type'] => {
    switch (eventName) {
      case 'button_click':
      case 'link_click':
        return 'click';
      case 'page_view':
        return 'navigation';
      case 'form_submit':
        return 'form_submit';
      default:
        return 'click';
    }
  };

  // Calculate analytics
  const totalSessions = sessions.length;
  const avgSessionDuration = totalSessions > 0 
    ? sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions / 1000 / 60 // minutes
    : 0;
  const avgPageViews = totalSessions > 0
    ? sessions.reduce((sum, s) => sum + s.pageViews, 0) / totalSessions
    : 0;
  const bounceRate = totalSessions > 0
    ? (sessions.filter(s => s.pageViews === 1).length / totalSessions) * 100
    : 0;

  // Device breakdown
  const deviceData = sessions.reduce((acc, session) => {
    acc[session.deviceType] = (acc[session.deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceChartData = Object.entries(deviceData).map(([device, count]) => ({
    device,
    count,
    percentage: ((count / totalSessions) * 100).toFixed(1)
  }));

  // Browser breakdown
  const browserData = sessions.reduce((acc, session) => {
    acc[session.browser] = (acc[session.browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const browserChartData = Object.entries(browserData).map(([browser, count]) => ({
    browser,
    count
  }));

  // Session duration buckets
  const durationBuckets = [
    { range: '0-30s', min: 0, max: 30, count: 0 },
    { range: '30s-2m', min: 30, max: 120, count: 0 },
    { range: '2-5m', min: 120, max: 300, count: 0 },
    { range: '5-10m', min: 300, max: 600, count: 0 },
    { range: '10m+', min: 600, max: Infinity, count: 0 }
  ];

  sessions.forEach(session => {
    const durationInSeconds = session.duration / 1000;
    const bucket = durationBuckets.find(b => durationInSeconds >= b.min && durationInSeconds < b.max);
    if (bucket) bucket.count++;
  });

  // Most clicked elements
  const topClickedElements = heatmapData
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Behavior Analytics</h2>
          <p className="text-muted-foreground">Detailed analysis of user interactions and behavior patterns</p>
        </div>
        
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map(timeframe => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session Duration</p>
                <p className="text-2xl font-bold">{avgSessionDuration.toFixed(1)}m</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pages per Session</p>
                <p className="text-2xl font-bold">{avgPageViews.toFixed(1)}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{bounceRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="heatmap">Click Heatmap</TabsTrigger>
          <TabsTrigger value="flow">User Flow</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={durationBuckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={browserChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ browser, count }) => `${browser}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {browserChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceChartData.map((device, index) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                          {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                          <span className="font-medium">{device.device}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{device.count} sessions</span>
                          <span className="text-xs text-muted-foreground block">{device.percentage}%</span>
                        </div>
                      </div>
                      <Progress value={parseFloat(device.percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceChartData.map(device => {
                    const deviceSessions = sessions.filter(s => s.deviceType === device.device);
                    const avgDuration = deviceSessions.length > 0
                      ? deviceSessions.reduce((sum, s) => sum + s.duration, 0) / deviceSessions.length / 1000 / 60
                      : 0;
                    const avgPages = deviceSessions.length > 0
                      ? deviceSessions.reduce((sum, s) => sum + s.pageViews, 0) / deviceSessions.length
                      : 0;

                    return (
                      <div key={device.device} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{device.device}</span>
                          <Badge variant="outline">{device.count} sessions</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avg Duration</p>
                            <p className="font-medium">{avgDuration.toFixed(1)}m</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pages/Session</p>
                            <p className="font-medium">{avgPages.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Most Clicked Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topClickedElements.map((element, index) => (
                  <div key={element.element} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{element.element}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{element.clicks}</span>
                      <span className="text-sm text-muted-foreground block">clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Flow Tab */}
        <TabsContent value="flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                User Flow Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>User flow visualization coming soon...</p>
                <p className="text-sm">This will show the most common paths users take through your application.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};