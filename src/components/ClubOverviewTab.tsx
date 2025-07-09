import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';
import ClubDashboardOverview from '@/components/ClubDashboardOverview';
import ClubStatsDashboard from '@/components/ClubStatsDashboard';

const ClubOverviewTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tổng quan</h2>
        <p className="text-muted-foreground">
          Dashboard tổng hợp và thống kê chi tiết của câu lạc bộ
        </p>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Thống kê chi tiết
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ClubDashboardOverview />
        </TabsContent>

        <TabsContent value="statistics">
          <ClubStatsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubOverviewTab;