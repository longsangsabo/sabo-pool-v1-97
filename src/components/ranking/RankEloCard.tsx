import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, TrendingUpIcon } from 'lucide-react';
import { 
  calculateRankProgress, 
  getNextRank, 
  formatRankDisplay, 
  getRankColor,
  type RankCode 
} from '@/utils/rankUtils';
import { RANK_ELO } from '@/utils/eloConstants';

interface RankEloCardProps {
  rank: RankCode;
  elo: number;
  matchCount: number;
  isEligibleForPromotion?: boolean;
}

export const RankEloCard: React.FC<RankEloCardProps> = ({
  rank,
  elo,
  matchCount,
  isEligibleForPromotion = false
}) => {
  const { currentRankElo, nextRankElo, progress, pointsNeeded } = calculateRankProgress(elo, rank);
  const nextRank = getNextRank(rank);
  const rankColor = getRankColor(rank);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={rankColor}>{formatRankDisplay(rank)}</span>
            <Badge variant="secondary">{elo} ELO</Badge>
            {isEligibleForPromotion && (
              <Badge variant="default" className="bg-green-500">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                Sẵn sàng thăng hạng
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p><strong>ELO là hệ thống tính điểm đánh giá kỹ năng và quyết định thăng hạng.</strong></p>
                <p>Mỗi hạng có mức ELO tối thiểu: K (1000), K+ (1100), I (1200), v.v.</p>
                <p>Khi đạt đủ điểm ELO, bạn sẽ tự động thăng hạng (cần tối thiểu 4 trận).</p>
                <p>Số trận của bạn: <strong>{matchCount}</strong></p>
              </div>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ELO Progress Bar */}
        {nextRank && nextRankElo ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={rankColor}>
                {formatRankDisplay(rank)} • {currentRankElo}
              </span>
              <span className={getRankColor(nextRank)}>
                {formatRankDisplay(nextRank)} • {nextRankElo}
              </span>
            </div>
            
            <Progress value={progress} className="h-3" />
            
            <div className="text-xs text-muted-foreground">
              {pointsNeeded > 0 ? (
                <span>{pointsNeeded} điểm ELO nữa để lên {formatRankDisplay(nextRank)}</span>
              ) : (
                <span className="text-green-600 font-medium">
                  Đã đủ điểm để thăng hạng!
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🏆</div>
            <p className="font-semibold text-lg text-yellow-600">Hạng cao nhất!</p>
            <p className="text-sm text-muted-foreground">
              Bạn đã đạt được hạng cao nhất trong hệ thống
            </p>
          </div>
        )}

        {/* Match Count Info */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Số trận đã chơi:</span>
          <span className="font-medium">{matchCount}</span>
        </div>

        {/* Promotion Requirements */}
        {matchCount < 4 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Cần {4 - matchCount} trận nữa</strong> để đủ điều kiện thăng hạng
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};