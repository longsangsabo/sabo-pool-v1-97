import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Trophy, Star, BarChart3, Target } from 'lucide-react';
import { EloRulesManager } from '@/components/admin/game-config/EloRulesManager';
import { RankDefinitionsManager } from '@/components/admin/game-config/RankDefinitionsManager';
import { SPARewardsManager } from '@/components/admin/game-config/SPARewardsManager';
import { TournamentRewardsManager } from '@/components/admin/game-config/TournamentRewardsManager';
import { GameConfigOverview } from '@/components/admin/game-config/GameConfigOverview';
import { GameConfigSync } from '@/components/admin/game-config/GameConfigSync';

const AdminGameConfig = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Game Configuration</h1>
          <p className="text-muted-foreground">
            Quản lý và cấu hình toàn bộ các thông số game logic cho SABO Pool Arena
          </p>
        </div>
        <GameConfigSync />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="elo" className="gap-2">
            <Target className="h-4 w-4" />
            ELO Rules
          </TabsTrigger>
          <TabsTrigger value="ranks" className="gap-2">
            <Star className="h-4 w-4" />
            Ranks
          </TabsTrigger>
          <TabsTrigger value="spa" className="gap-2">
            <Trophy className="h-4 w-4" />
            SPA Rewards
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="gap-2">
            <Settings className="h-4 w-4" />
            Tournaments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GameConfigOverview />
        </TabsContent>

        <TabsContent value="elo" className="space-y-6">
          <EloRulesManager />
        </TabsContent>

        <TabsContent value="ranks" className="space-y-6">
          <RankDefinitionsManager />
        </TabsContent>

        <TabsContent value="spa" className="space-y-6">
          <SPARewardsManager />
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-6">
          <TournamentRewardsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGameConfig;