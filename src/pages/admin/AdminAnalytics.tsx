
import React from 'react';
import { TrendingUp, Users, Trophy, CreditCard, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import DashboardChart from '@/components/charts/DashboardChart';
import RevenueChart from '@/components/charts/RevenueChart';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';

const AdminAnalytics = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
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

  const analytics = [
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

  const topClubs = [
    { name: 'Diamond Pool Club', revenue: '450M VND', matches: 234 },
    { name: 'Golden Cue Billiards', revenue: '380M VND', matches: 198 },
    { name: 'Royal Pool Arena', revenue: '320M VND', matches: 156 },
    { name: 'Elite Billiards', revenue: '290M VND', matches: 143 },
  ];

  return (
    <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Thống Kê & Phân Tích</h1>
          <p className='text-gray-600'>Báo cáo chi tiết về hoạt động của hệ thống</p>
        </div>

        <AdminStatsGrid stats={analytics} />

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
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                        <span className='text-sm font-medium text-blue-600'>{index + 1}</span>
                      </div>
                      <div>
                        <p className='font-medium'>{club.name}</p>
                        <p className='text-sm text-gray-500'>{club.matches} trận đấu</p>
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
                <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-green-800'>Người dùng mới</p>
                    <p className='text-sm text-green-600'>127 tài khoản</p>
                  </div>
                  <TrendingUp className='w-6 h-6 text-green-600' />
                </div>
                <div className='flex justify-between items-center p-3 bg-blue-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-blue-800'>Trận đấu</p>
                    <p className='text-sm text-blue-600'>489 trận</p>
                  </div>
                  <Trophy className='w-6 h-6 text-blue-600' />
                </div>
                <div className='flex justify-between items-center p-3 bg-purple-50 rounded-lg'>
                  <div>
                    <p className='font-medium text-purple-800'>Giao dịch</p>
                    <p className='text-sm text-purple-600'>1,245 lượt</p>
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
      </div>
    );
};

export default AdminAnalytics;
