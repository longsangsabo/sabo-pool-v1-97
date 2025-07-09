import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingClubs: number;
  approvedClubs: number;
  totalTournaments: number;
  activeTournaments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

interface ActivityData {
  name: string;
  value: number;
  previous: number;
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic counts in parallel
      const [
        profilesResult,
        clubRegistrationsResult,
        clubProfilesResult,
        tournamentsResult,
        transactionsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('club_registrations').select('status', { count: 'exact' }),
        supabase.from('club_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('status'),
        supabase.from('payment_transactions').select('amount, status, created_at')
      ]);

      // Process club registrations
      const pendingClubs = clubRegistrationsResult.data?.filter(
        reg => reg.status === 'pending'
      ).length || 0;

      // Process tournaments
      const activeTournaments = tournamentsResult.data?.filter(
        t => t.status === 'active' || t.status === 'ongoing'
      ).length || 0;

      // Process revenue
      const successfulTransactions = transactionsResult.data?.filter(
        t => t.status === 'success'
      ) || [];
      
      const totalRevenue = successfulTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const currentMonth = new Date().getMonth();
      const monthlyRevenue = successfulTransactions
        .filter(t => new Date(t.created_at).getMonth() === currentMonth)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const dashboardStats: DashboardStats = {
        totalUsers: profilesResult.count || 0,
        activeUsers: profilesResult.count || 0, // TODO: Add logic for active users
        pendingClubs,
        approvedClubs: clubProfilesResult.count || 0,
        totalTournaments: tournamentsResult.data?.length || 0,
        activeTournaments,
        totalRevenue,
        monthlyRevenue,
        systemHealth: 'healthy' // TODO: Add real health checking
      };

      setStats(dashboardStats);

      // Generate mock revenue data for the last 6 months
      const revenueData: RevenueData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short' });
        
        revenueData.push({
          month: monthName,
          revenue: Math.floor(Math.random() * 500000000) + 100000000, // 100M - 600M VND
          target: 400000000 // 400M VND target
        });
      }
      setRevenueData(revenueData);

      // Generate activity data for the last 7 days
      const activityData: ActivityData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
        
        activityData.push({
          name: dayName,
          value: Math.floor(Math.random() * 200) + 50,
          previous: Math.floor(Math.random() * 180) + 40
        });
      }
      setActivityData(activityData);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Không thể tải dữ liệu dashboard');
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    await fetchDashboardStats();
    toast.success('Đã cập nhật dữ liệu thành công');
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    revenueData,
    activityData,
    loading,
    error,
    refreshStats
  };
};