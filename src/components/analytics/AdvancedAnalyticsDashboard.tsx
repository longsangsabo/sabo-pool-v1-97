import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { 
  Calendar as CalendarIcon,
  Download, 
  Filter, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  pageViews: any[];
  userBehavior: any[];
  performance: any[];
  errors: any[];
  sessionData: any[];
  conversionFunnels: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#82ca9d', '#ffc658', '#ff7300'];

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState('pageviews');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    pageViews: [],
    userBehavior: [],
    performance: [],
    errors: [],
    sessionData: [],
    conversionFunnels: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      // Fetch page views and analytics events
      const { data: events } = await supabase
        .from('analytics_events' as any)
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: true });

      // Fetch performance metrics
      const { data: performanceData } = await supabase
        .from('api_performance_metrics' as any)
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: true });

      // Fetch error logs
      const { data: errorData } = await supabase
        .from('error_logs' as any)
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: true });

      // Process data for charts
      const processedData = processAnalyticsData(events || [], performanceData || [], errorData || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (events: any[], performance: any[], errors: any[]): AnalyticsData => {
    // Group events by day for page views
    const pageViewsByDay = events
      .filter(e => e.event_name === 'page_view')
      .reduce((acc, event) => {
        const day = format(new Date(event.timestamp), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const pageViews = Object.entries(pageViewsByDay).map(([date, views]) => ({
      date,
      views,
      dateFormatted: format(new Date(date), 'MMM dd')
    }));

    // Process user behavior
    const behaviorEvents = events.filter(e => ['button_click', 'link_click', 'form_submit'].includes(e.event_name));
    const userBehavior = behaviorEvents.reduce((acc, event) => {
      const existing = acc.find(item => item.action === event.event_name);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ action: event.event_name, count: 1 });
      }
      return acc;
    }, [] as any[]);

    // Process performance data
    const avgPerformanceByDay = performance.reduce((acc, metric) => {
      const day = format(new Date(metric.timestamp), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = { total: 0, count: 0 };
      }
      acc[day].total += metric.duration;
      acc[day].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const performanceChart = Object.entries(avgPerformanceByDay).map(([date, data]) => ({
      date,
      avgResponseTime: Math.round((data as { total: number; count: number }).total / (data as { total: number; count: number }).count),
      dateFormatted: format(new Date(date), 'MMM dd')
    }));

    // Process session data
    const sessionsData = events
      .filter(e => e.session_id)
      .reduce((acc, event) => {
        const session = acc.find(s => s.session_id === event.session_id);
        if (session) {
          session.events.push(event);
          session.duration = new Date(event.timestamp).getTime() - new Date(session.startTime).getTime();
        } else {
          acc.push({
            session_id: event.session_id,
            startTime: event.timestamp,
            events: [event],
            duration: 0
          });
        }
        return acc;
      }, [] as any[]);

    // Calculate session metrics
    const sessionMetrics = sessionsData.map(session => ({
      duration: Math.round(session.duration / 1000 / 60), // minutes
      pageViews: session.events.filter((e: any) => e.event_name === 'page_view').length,
      bounceRate: session.events.length === 1 ? 1 : 0
    }));

    const sessionData = [
      {
        metric: 'Avg Session Duration',
        value: sessionMetrics.length > 0 
          ? Math.round(sessionMetrics.reduce((sum, s) => sum + s.duration, 0) / sessionMetrics.length)
          : 0,
        unit: 'min'
      },
      {
        metric: 'Avg Pages per Session',
        value: sessionMetrics.length > 0
          ? Math.round(sessionMetrics.reduce((sum, s) => sum + s.pageViews, 0) / sessionMetrics.length * 10) / 10
          : 0,
        unit: 'pages'
      },
      {
        metric: 'Bounce Rate',
        value: sessionMetrics.length > 0
          ? Math.round(sessionMetrics.reduce((sum, s) => sum + s.bounceRate, 0) / sessionMetrics.length * 100)
          : 0,
        unit: '%'
      }
    ];

    // Process conversion funnels (tournament flow example)
    const tournamentEvents = events.filter(e => e.event_name.includes('tournament'));
    const conversionFunnels = [
      { step: 'Tournament View', count: tournamentEvents.filter(e => e.event_name === 'tournament_view').length },
      { step: 'Registration Started', count: tournamentEvents.filter(e => e.event_name === 'tournament_registration_start').length },
      { step: 'Registration Completed', count: tournamentEvents.filter(e => e.event_name === 'tournament_registration').length }
    ];

    return {
      pageViews,
      userBehavior,
      performance: performanceChart,
      errors: errors.map(e => ({
        timestamp: e.timestamp,
        type: e.error_type,
        message: e.error_message
      })),
      sessionData,
      conversionFunnels
    };
  };

  const quickDateRanges = [
    { label: 'Last 7 days', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Last 30 days', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: 'Last 3 months', value: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  ];

  const exportData = () => {
    const dataToExport = {
      dateRange: {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString()
      },
      data: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Detailed insights and performance analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Date Range Buttons */}
          <div className="flex gap-2">
            {quickDateRanges.map((range, index) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm"
                onClick={() => setDateRange(range.value())}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Export and Refresh */}
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button variant="outline" onClick={fetchAnalyticsData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Page Views</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.pageViews.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Sessions</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.sessionData.length > 0 ? analyticsData.sessionData.length.toLocaleString() : '0'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.performance.length > 0 
                        ? Math.round(analyticsData.performance.reduce((sum, item) => sum + item.avgResponseTime, 0) / analyticsData.performance.length)
                        : 0}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {((analyticsData.errors.length / Math.max(analyticsData.pageViews.reduce((sum, item) => sum + item.views, 0), 1)) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Page Views Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analyticsData.pageViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateFormatted" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  User Behavior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie 
                      data={analyticsData.userBehavior} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80} 
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.userBehavior.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={analyticsData.pageViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateFormatted" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.userBehavior}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.sessionData.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{metric.metric}</span>
                      <span className="text-lg font-bold">
                        {metric.value} {metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={analyticsData.performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateFormatted" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgResponseTime" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.conversionFunnels.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{step.step}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{step.count.toLocaleString()}</div>
                        {index > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {((step.count / analyticsData.conversionFunnels[0].count) * 100).toFixed(1)}% conversion
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};