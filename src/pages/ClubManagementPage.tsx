import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Trophy, Users, Bell, Settings } from 'lucide-react';
import ClubOverviewTab from '@/components/ClubOverviewTab';
import ClubTournamentsTab from '@/components/ClubTournamentsTab';
import ClubMembersTab from '@/components/ClubMembersTab';
import ClubNotifications from '@/components/ClubNotifications';
import ClubSettingsTab from '@/components/ClubSettingsTab';

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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-3 py-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2 px-3 py-2">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Giải đấu</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 px-3 py-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Thành viên</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 px-3 py-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 px-3 py-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClubOverviewTab />
        </TabsContent>

        <TabsContent value="tournaments">
          <ClubTournamentsTab />
        </TabsContent>

        <TabsContent value="members">
          <ClubMembersTab />
        </TabsContent>

        <TabsContent value="notifications">
          <ClubNotifications />
        </TabsContent>

        <TabsContent value="settings">
          <ClubSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubManagementPage;