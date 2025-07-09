
import React from 'react';
import { TrendingUp, Users, Trophy, CreditCard, Calendar, BarChart3, Languages, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useTranslationAnalytics } from '@/hooks/useTranslationAnalytics';
import DashboardChart from '@/components/charts/DashboardChart';
import RevenueChart from '@/components/charts/RevenueChart';
import TranslationAnalyticsChart from '@/components/charts/TranslationAnalyticsChart';
import RealTimeMetricsCard from '@/components/charts/RealTimeMetricsCard';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';

const AdminAnalytics = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useTranslationAnalytics();

  if (adminLoading || analyticsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h2>
          <p className='text-gray-600'>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const generalAnalytics = [
    {
      title: 'Tổng doanh thu',
      value: '2.5B VND',
      change: '+15%',
      trend: 'up' as const,
      icon: CreditCard,
      color: 'text-green-600',
      subtitle: 'Tháng này',
    },
    {
      title: 'Người dùng hoạt động',
      value: '1,847',
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-600',
      subtitle: '30 ngày qua',
    },
    {
      title: 'Giải đấu hoàn thành',
      value: '45',
      change: '+8%',
      trend: 'up' as const,
      icon: Trophy,
      color: 'text-yellow-600',
      subtitle: 'Quý này',
    },
    {
      title: 'Tỷ lệ tăng trưởng',
      value: '23%',
      change: '+5%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-purple-600',
      subtitle: 'So với quý trước',
    },
  ];

  const translationAnalytics = analytics ? [
    {
      title: 'Tổng dịch thuật',
      value: analytics.totalTranslations.toLocaleString(),
      change: '+24%',
      trend: 'up' as const,
      icon: Languages,
      color: 'text-primary',
      subtitle: '30 ngày qua',
    },
    {
      title: 'Dịch tự động',
      value: analytics.automatedTranslations.toLocaleString(),
      change: '+35%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-green-600',
      subtitle: `${Math.round((analytics.automatedTranslations / analytics.totalTranslations) * 100)}% tổng số`,
    },
    {
      title: 'Độ chính xác',
      value: `${analytics.averageAccuracy.toFixed(1)}%`,
      change: '+3%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-blue-600',
      subtitle: 'Trung bình',
    },
    {
      title: 'Thời gian xử lý',
      value: `${analytics.processingTime}ms`,
      change: '-8%',
      trend: 'down' as const,
      icon: BarChart3,
      color: 'text-purple-600',
      subtitle: 'Trung bình',
    },
  ] : [];

  const topClubs = [
    { name: 'Diamond Pool Club', revenue: '450M VND', matches: 234 },
    { name: 'Golden Cue Billiards', revenue: '380M VND', matches: 198 },
    { name: 'Royal Pool Arena', revenue: '320M VND', matches: 156 },
    { name: 'Elite Billiards', revenue: '290M VND', matches: 143 },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Thống Kê & Phân Tích</h1>
          <p className='text-muted-foreground'>Báo cáo chi tiết về hoạt động của hệ thống</p>
        </div>
        <Button onClick={refreshAnalytics} className='gap-2'>
          <RefreshCw className='w-4 h-4' />
          Làm mới dữ liệu
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="translation">Dịch thuật</TabsTrigger>
          <TabsTrigger value="realtime">Thời gian thực</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStatsGrid stats={generalAnalytics} />

          <div className='grid gap-6 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Top CLB theo doanh thu</CardTitle>
                <CardDescription>Thống kê tháng này</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {topClubs.map((club, index) => (
                    <div key={club.name} className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                          <span className='text-sm font-medium text-primary'>{index + 1}</span>
                        </div>
                        <div>
                          <p className='font-medium'>{club.name}</p>
                          <p className='text-sm text-muted-foreground'>{club.matches} trận đấu</p>
                        </div>
                      </div>
                      <p className='font-medium text-green-600'>{club.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Thống kê 7 ngày qua</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg'>
                    <div>
                      <p className='font-medium text-green-800 dark:text-green-200'>Người dùng mới</p>
                      <p className='text-sm text-green-600 dark:text-green-400'>127 tài khoản</p>
                    </div>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                  <div className='flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg'>
                    <div>
                      <p className='font-medium text-blue-800 dark:text-blue-200'>Trận đấu</p>
                      <p className='text-sm text-blue-600 dark:text-blue-400'>489 trận</p>
                    </div>
                    <Trophy className='w-6 h-6 text-blue-600' />
                  </div>
                  <div className='flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg'>
                    <div>
                      <p className='font-medium text-purple-800 dark:text-purple-200'>Giao dịch</p>
                      <p className='text-sm text-purple-600 dark:text-purple-400'>1,245 lượt</p>
                    </div>
                    <CreditCard className='w-6 h-6 text-purple-600' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-1">
              <DashboardChart 
                data={[
                  { name: 'Mon', value: 120, previous: 100 },
                  { name: 'Tue', value: 150, previous: 120 },
                  { name: 'Wed', value: 180, previous: 140 },
                  { name: 'Thu', value: 165, previous: 160 },
                  { name: 'Fri', value: 190, previous: 170 },
                  { name: 'Sat', value: 220, previous: 200 },
                  { name: 'Sun', value: 200, previous: 180 }
                ]}
                title="Hoạt động tuần này"
                color="hsl(var(--primary))"
              />
            </div>
          </div>

          <div className="grid gap-6">
            <RevenueChart 
              data={[
                { month: 'Jan', revenue: 400000000, target: 450000000 },
                { month: 'Feb', revenue: 450000000, target: 450000000 },
                { month: 'Mar', revenue: 380000000, target: 450000000 },
                { month: 'Apr', revenue: 520000000, target: 450000000 },
                { month: 'May', revenue: 480000000, target: 450000000 },
                { month: 'Jun', revenue: 550000000, target: 450000000 }
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="translation" className="space-y-6">
          <AdminStatsGrid stats={translationAnalytics} loading={analyticsLoading} />
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê dịch thuật theo thời gian</CardTitle>
                <CardDescription>Dữ liệu 30 ngày qua</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <TranslationAnalyticsChart 
                    data={analytics.dailyMetrics}
                    languagePairs={analytics.languagePairs}
                    title="Xu hướng dịch thuật"
                    type="timeline"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố cặp ngôn ngữ</CardTitle>
                <CardDescription>Thống kê theo số lượng dịch</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <TranslationAnalyticsChart 
                    data={analytics.dailyMetrics}
                    languagePairs={analytics.languagePairs}
                    title="Cặp ngôn ngữ phổ biến"
                    type="distribution"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Độ chính xác theo cặp ngôn ngữ</CardTitle>
                <CardDescription>So sánh hiệu suất dịch thuật</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <TranslationAnalyticsChart 
                    data={analytics.dailyMetrics}
                    languagePairs={analytics.languagePairs}
                    title="Hiệu suất theo ngôn ngữ"
                    type="accuracy"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {analytics && (
            <RealTimeMetricsCard 
              metrics={analytics.realTimeMetrics}
              updateInterval={5000}
            />
          )}
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động dịch thuật trực tiếp</CardTitle>
                <CardDescription>Cập nhật mỗi 5 giây</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div>
                      <p className="font-medium">Đang xử lý</p>
                      <p className="text-sm text-muted-foreground">3 tác vụ dịch thuật</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>EN → VI: "How to play billiards"</span>
                      <Badge variant="secondary">85%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>VI → EN: "Luật thi đấu"</span>
                      <Badge variant="secondary">92%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>JA → VI: "プールゲーム"</span>
                      <Badge variant="secondary">78%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê hệ thống</CardTitle>
                <CardDescription>Tình trạng máy chủ dịch thuật</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">156ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Queue Size</span>
                    <span className="text-sm font-medium">12 items</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
