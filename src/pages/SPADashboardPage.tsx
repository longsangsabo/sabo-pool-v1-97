import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SPAAnalyticsDashboard } from '@/components/analytics/SPAAnalyticsDashboard';
import { RealtimeSPAFeed } from '@/components/spa/RealtimeSPAFeed';
import { AdminSPAManager } from '@/components/admin/AdminSPAManager';
import { EnhancedSPALeaderboard } from '@/components/spa/EnhancedSPALeaderboard';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export default function SPADashboardPage() {
  const { isAdmin } = useAdminCheck();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">SPA Dashboard</h1>
        <p className="text-muted-foreground">
          Hệ thống phân tích và quản lý SPA Points nâng cao
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          <TabsTrigger value="leaderboard">Xếp hạng</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Quản lý</TabsTrigger>}
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <SPAAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <EnhancedSPALeaderboard />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RealtimeSPAFeed />
            </div>
            <div className="lg:col-span-2">
              {/* Additional real-time components can go here */}
              <div className="text-center py-12 text-muted-foreground">
                <p>Thêm components real-time khác tại đây</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <AdminSPAManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}