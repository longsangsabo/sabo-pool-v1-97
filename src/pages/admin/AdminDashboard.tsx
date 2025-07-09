
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Building2, CreditCard, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { unreadCount, highPriorityCount } = useEnhancedNotifications();
  const { t } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // Fetch dashboard stats from existing tables  
  const fetchDashboardStats = async () => {
    try {
      const [clubRegistrations, clubProfiles, notifications] = await Promise.all([
        supabase.from('club_registrations').select('status', { count: 'exact', head: true }),
        supabase.from('club_profiles').select('verification_status', { count: 'exact', head: true }),
        supabase.from('notifications').select('is_read', { count: 'exact', head: true })
      ]);

      const data = {
        pending_registrations: clubRegistrations.count || 0,
        active_clubs: clubProfiles.count || 0,
        pending_verifications: notifications.count || 0
      };
      
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Không thể tải thống kê dashboard');
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Get basic system health indicators
      const [profilesCount, tournamentsCount, clubsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tournaments').select('id', { count: 'exact', head: true }),
        supabase.from('club_profiles').select('id', { count: 'exact', head: true })
      ]);

      setSystemHealth({
        total_users: profilesCount.count || 0,
        total_tournaments: tournamentsCount.count || 0,
        total_clubs: clubsCount.count || 0,
        system_status: 'healthy'
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth({ system_status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats from materialized view
  useEffect(() => {

    if (isAdmin) {
      fetchDashboardStats();
      fetchSystemHealth();
    }
  }, [isAdmin]);

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
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>{t('common.access_denied')}</h2>
          <p className='text-gray-600'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  const refreshStats = async () => {
    try {
      // Re-fetch dashboard stats
      fetchDashboardStats();
      fetchSystemHealth();
      toast.success('Đã cập nhật thống kê thành công');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Có lỗi khi cập nhật thống kê');
    }
  };

  const clubStats = {
    pending: dashboardStats?.pending_registrations || 0,
    approved: dashboardStats?.active_clubs || 0,
    total: (dashboardStats?.pending_registrations || 0) + (dashboardStats?.active_clubs || 0),
    rejected: 0,
    approval_rate: dashboardStats?.active_clubs > 0 ? 
      Math.round((dashboardStats.active_clubs / ((dashboardStats.pending_registrations || 0) + dashboardStats.active_clubs)) * 100) : 0,
    today_submissions: 0
  };
  const notificationStats = {
    total: dashboardStats?.pending_verifications || 0,
    unread: dashboardStats?.pending_verifications || 0,
    high_priority: highPriorityCount || 0,
    today_notifications: 0
  };

  const stats = [
    {
      title: t('admin.total_users'),
      value: systemHealth?.total_users?.toLocaleString() || '0',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      status: 'stable'
    },
    {
      title: t('admin.pending_club_registrations'),
      value: clubStats.pending || '0',
      change: `${clubStats.today_submissions || 0} ${t('admin.today')}`,
      icon: Building2,
      color: 'text-yellow-600',
      status: clubStats.pending > 0 ? 'warning' : 'stable'
    },
    {
      title: t('admin.approved_clubs'),
      value: clubStats.approved || '0',
      change: `${clubStats.approval_rate || 0}% ${t('admin.approval_rate')}`,
      icon: CheckCircle,
      color: 'text-green-600',
      status: 'stable'
    },
    {
      title: t('admin.unread_notifications'),
      value: notificationStats.unread || '0',
      change: `${notificationStats.high_priority || 0} ${t('admin.high_priority')}`,
      icon: AlertTriangle,
      color: highPriorityCount > 0 ? 'text-red-600' : 'text-gray-600',
      status: highPriorityCount > 0 ? 'alert' : 'stable'
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
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
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='w-5 h-5' />
              {t('admin.system_status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth?.system_status === 'healthy' ? 'bg-green-500' : 
                  systemHealth?.system_status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className='text-sm font-medium'>
                  {systemHealth?.system_status === 'healthy' ? t('admin.system_healthy') :
                   systemHealth?.system_status === 'warning' ? t('admin.system_warning') : t('admin.system_error')}
                </span>
              </div>
              <div className='text-sm text-gray-500'>
                {t('admin.last_updated')}: {new Date().toLocaleString('vi-VN')}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className={`${
                stat.status === 'alert' ? 'border-red-200 bg-red-50' :
                stat.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''
              }`}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
                  <div className='flex items-center gap-2'>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    {stat.status === 'alert' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                    {stat.status === 'warning' && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stat.value}</div>
                  <div className='flex items-center text-xs text-gray-600'>
                    <Clock className='h-3 w-3 mr-1' />
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.quick_actions')}</CardTitle>
              <CardDescription>{t('admin.common_actions')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button 
                variant="outline" 
                className='w-full justify-start gap-2'
                onClick={() => window.location.href = '/admin/clubs'}
              >
                <Building2 className='w-4 h-4' />
                {t('admin.approve_clubs')} ({clubStats.pending || 0})
              </Button>
              <Button 
                variant="outline" 
                className='w-full justify-start gap-2'
                onClick={() => window.location.href = '/admin/tournaments'}
              >
                <Trophy className='w-4 h-4' />
                {t('admin.manage_tournaments')}
              </Button>
              <Button 
                variant="outline" 
                className='w-full justify-start gap-2'
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className='w-4 h-4' />
                {t('admin.manage_users')}
              </Button>
            </CardContent>
          </Card>

          {/* Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.club_registration_status')}</CardTitle>
              <CardDescription>{t('admin.club_stats')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.total_registrations')}</span>
                  <span className='text-sm font-medium'>{clubStats.total || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.pending')}</span>
                  <span className='text-sm font-medium text-yellow-600'>{clubStats.pending || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.approved')}</span>
                  <span className='text-sm font-medium text-green-600'>{clubStats.approved || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.rejected')}</span>
                  <span className='text-sm font-medium text-red-600'>{clubStats.rejected || 0}</span>
                </div>
                <div className='pt-2 border-t'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>{t('admin.approval_rate')}</span>
                    <span className='text-sm font-medium'>{clubStats.approval_rate || 0}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.system_notifications')}</CardTitle>
              <CardDescription>{t('admin.notification_status')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.total_notifications')}</span>
                  <span className='text-sm font-medium'>{notificationStats.total || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.unread')}</span>
                  <span className='text-sm font-medium text-blue-600'>{notificationStats.unread || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.high_priority')}</span>
                  <span className='text-sm font-medium text-red-600'>{notificationStats.high_priority || 0}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('admin.today')}</span>
                  <span className='text-sm font-medium'>{notificationStats.today_notifications || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
};

export default AdminDashboard;
