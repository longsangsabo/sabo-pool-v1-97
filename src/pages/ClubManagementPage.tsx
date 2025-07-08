import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Trophy, Users, Settings, BarChart3, Bell, CreditCard } from 'lucide-react';
import SimpleRankVerification from '@/components/SimpleRankVerification';
import ClubMemberManagement from '@/components/ClubMemberManagement';
import ClubStatsDashboard from '@/components/ClubStatsDashboard';
import ClubNotifications from '@/components/ClubNotifications';
import ClubSettings from '@/components/ClubSettings';
import ClubDashboardOverview from '@/components/ClubDashboardOverview';
import ClubProfileForm from '@/components/ClubProfileForm';
import TournamentPaymentManager from '@/components/TournamentPaymentManager';

const ClubManagementPage = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is a verified club owner
  const [hasClubAccess, setHasClubAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (user) {
      const checkClubAccess = async () => {
        try {
          const { data, error } = await supabase
            .from('club_profiles')
            .select('id, verification_status')
            .eq('user_id', user.id)
            .single();
          
          setHasClubAccess(!!data && data.verification_status === 'approved');
        } catch (error) {
          setHasClubAccess(false);
        } finally {
          setCheckingAccess(false);
        }
      };
      checkClubAccess();
    } else {
      setCheckingAccess(false);
    }
  }, [user]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !hasClubAccess) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Quản lý Câu lạc bộ</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý thông tin CLB, xác thực hạng và theo dõi hoạt động
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="rank-verification" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Xác thực Hạng</span>
          </TabsTrigger>
          <TabsTrigger value="payment-manager" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Thanh toán</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Thành viên</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Cài đặt</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Hồ sơ CLB</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClubDashboardOverview />
        </TabsContent>

        <TabsContent value="rank-verification">
          <SimpleRankVerification />
        </TabsContent>

        <TabsContent value="payment-manager">
          <TournamentPaymentManager />
        </TabsContent>

        <TabsContent value="members">
          <ClubMemberManagement />
        </TabsContent>

        <TabsContent value="notifications">
          <ClubNotifications />
        </TabsContent>

        <TabsContent value="settings">
          <ClubSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ClubProfileForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubManagementPage;