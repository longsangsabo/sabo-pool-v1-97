
import React from 'react';
import { Users, Trophy, Building2, CreditCard, Activity, TrendingUp } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { Button } from '@/components/ui/button';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import QuickActions from '@/components/admin/QuickActions';
import SystemHealthCard from '@/components/admin/SystemHealthCard';
import DashboardChart from '@/components/charts/DashboardChart';
import RevenueChart from '@/components/charts/RevenueChart';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

const AdminDashboard = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { unreadCount, highPriorityCount } = useEnhancedNotifications();
  const { t } = useLanguage();
  const { stats, revenueData, activityData, loading, refreshStats } = useAdminDashboard();

  if (adminLoading || loading) {
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
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>{t('common.access_denied')}</h2>
          <p className='text-gray-600'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const adminStats = [
    {
      title: t('admin.total_users'),
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-600',
      subtitle: t('admin.active_users')
    },
    {
      title: t('admin.pending_club_registrations'),
      value: stats.pendingClubs,
      change: 'Hôm nay',
      icon: Building2,
      color: 'text-yellow-600',
      status: stats.pendingClubs > 0 ? 'warning' as const : 'normal' as const,
      subtitle: t('admin.requires_approval')
    },
    {
      title: t('admin.monthly_revenue'),
      value: `${(stats.monthlyRevenue / 1000000).toFixed(1)}M VND`,
      change: '+15%',
      trend: 'up' as const,
      icon: CreditCard,
      color: 'text-green-600',
      subtitle: t('admin.this_month')
    },
    {
      title: t('admin.active_tournaments'),
      value: stats.activeTournaments,
      change: 'Đang diễn ra',
      icon: Trophy,
      color: 'text-purple-600',
      subtitle: t('admin.total') + `: ${stats.totalTournaments}`
    }
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{t('admin.dashboard_title')}</h1>
          <p className='text-gray-600'>{t('admin.dashboard_desc')}</p>
        </div>
        <div className='flex gap-3'>
          <Button 
            variant="outline" 
            onClick={refreshStats}
            className='gap-2'
          >
            <Activity className='w-4 h-4' />
            {t('admin.refresh_stats')}
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <SystemHealthCard 
        systemStatus={stats.systemHealth}
        lastUpdated={new Date().toLocaleTimeString('vi-VN')}
      />

      {/* Stats Grid */}
      <AdminStatsGrid stats={adminStats} loading={loading} />

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Quick Actions */}
        <QuickActions 
          pendingClubs={stats.pendingClubs}
          pendingTournaments={stats.activeTournaments}
          activeIssues={0}
        />

        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <DashboardChart 
            data={activityData}
            title={t('admin.daily_activity')}
            color="hsl(var(--primary))"
          />
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="grid gap-6 lg:grid-cols-1">
        <RevenueChart data={revenueData} />
      </div>
    </div>
  );
};

export default AdminDashboard;
