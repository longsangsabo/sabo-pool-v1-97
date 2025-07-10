import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { RankEloCard } from '@/components/ranking/RankEloCard';
import { SPAPointsCard } from '@/components/ranking/SPAPointsCard';
import { RankProgressBar } from '@/components/ranking/RankProgressBar';
import { type RankCode } from '@/utils/rankUtils';
import { isEligibleForPromotion } from '@/utils/rankUtils';

interface PlayerData {
  rank: RankCode;
  elo_points: number;
  spa_points: number;
  total_matches: number;
  last_promotion_date?: Date | null;
  weekly_spa_rank?: number;
  monthly_spa_rank?: number;
}

interface RankingSPATabsProps {
  playerData: PlayerData;
  eloHistory?: any[];
  spaMilestones?: any[];
}

export const RankingSPATabs: React.FC<RankingSPATabsProps> = ({
  playerData,
  eloHistory = [],
  spaMilestones = []
}) => {
  const isEligiblePromotion = isEligibleForPromotion(
    playerData.elo_points,
    playerData.rank
  );

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="elo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="elo" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Rank & ELO</span>
            <span className="sm:hidden">ELO</span>
            {isEligiblePromotion && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="spa" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">SPA Points</span>
            <span className="sm:hidden">SPA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elo" className="space-y-6">
          <div className="grid gap-6">
            {/* ELO Rank Card */}
            <RankEloCard
              rank={playerData.rank}
              elo={playerData.elo_points}
              matchCount={playerData.total_matches}
              isEligibleForPromotion={isEligiblePromotion}
            />

            {/* Enhanced Progress Bar */}
            <RankProgressBar
              current={{
                code: playerData.rank,
                name: playerData.rank,
                level: playerData.elo_points
              }}
              progress={0} // This will be calculated in the component
              pointsToNext={0} // This will be calculated in the component
              pointsNeeded={0} // This will be calculated in the component
            />

            {/* ELO History Chart Placeholder */}
            {eloHistory.length > 0 && (
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Lịch sử ELO
                </h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Biểu đồ ELO sẽ được hiển thị ở đây
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="spa" className="space-y-6">
          <div className="grid gap-6">
            {/* SPA Points Card */}
            <SPAPointsCard
              points={playerData.spa_points}
              milestones={spaMilestones}
              weeklyRank={playerData.weekly_spa_rank}
              monthlyRank={playerData.monthly_spa_rank}
            />

            {/* SPA Leaderboard Preview */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Bảng xếp hạng SPA
              </h3>
              <div className="space-y-3">
                {playerData.weekly_spa_rank && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Xếp hạng tuần này</span>
                    <span className="text-lg font-bold text-blue-600">#{playerData.weekly_spa_rank}</span>
                  </div>
                )}
                {playerData.monthly_spa_rank && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Xếp hạng tháng này</span>
                    <span className="text-lg font-bold text-green-600">#{playerData.monthly_spa_rank}</span>
                  </div>
                )}
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Xem bảng xếp hạng đầy đủ tại trang Leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};