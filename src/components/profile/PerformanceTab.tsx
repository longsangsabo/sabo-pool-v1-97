import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, TrendingUp } from 'lucide-react';
import { RankingDashboard } from '@/components/ranking';
import RankVerificationForm from '@/components/RankVerificationForm';
import PlayerStatsComponent from '@/components/PlayerStatsComponent';

const PerformanceTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thành tích & Ranking</h2>
        <p className="text-muted-foreground">
          Theo dõi xếp hạng, xác thực trình độ và xem thống kê chi tiết của bạn
        </p>
      </div>
      
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Ranking Dashboard
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Xác thực hạng
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Thống kê chi tiết
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <RankingDashboard />
        </TabsContent>

        <TabsContent value="verification">
          <RankVerificationForm />
        </TabsContent>

        <TabsContent value="stats">
          <PlayerStatsComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceTab;