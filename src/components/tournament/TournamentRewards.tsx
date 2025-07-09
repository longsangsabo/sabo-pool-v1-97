import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Users, Gift, DollarSign, InfoIcon } from 'lucide-react';
import { RankingService } from '@/services/rankingService';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';
import type { PrizeStructure } from './PrizeManagementModal';

interface TournamentRewardsProps {
  rank: RankCode;
  showElo?: boolean;
  showSpa?: boolean;
  className?: string;
  prizeStructure?: PrizeStructure;
  entryFee?: number;
  maxParticipants?: number;
}

const PositionIcon = ({ position }: { position: TournamentPosition }) => {
  const iconMap = {
    CHAMPION: <Trophy className="w-5 h-5 text-yellow-500" />,
    RUNNER_UP: <Medal className="w-5 h-5 text-gray-400" />,
    THIRD_PLACE: <Award className="w-5 h-5 text-amber-600" />,
    FOURTH_PLACE: <Star className="w-5 h-5 text-blue-500" />,
    TOP_8: <Users className="w-5 h-5 text-green-500" />,
    TOP_16: <Users className="w-5 h-5 text-purple-500" />,
    PARTICIPATION: <Gift className="w-5 h-5 text-gray-500" />
  };
  
  return iconMap[position] || <Gift className="w-5 h-5 text-gray-500" />;
};

const RewardRow = ({ 
  position, 
  positionName,
  eloReward, 
  spaReward, 
  cashPrize,
  items,
  showElo, 
  showSpa,
  showCash 
}: {
  position: TournamentPosition | number;
  positionName: string;
  eloReward: number;
  spaReward: number;
  cashPrize?: number;
  items?: string[];
  showElo: boolean;
  showSpa: boolean;
  showCash: boolean;
}) => {
  const getPositionIcon = (pos: TournamentPosition | number) => {
    if (pos === 'CHAMPION' || pos === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (pos === 'RUNNER_UP' || pos === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (pos === 'THIRD_PLACE' || pos === 3) return <Award className="w-5 h-5 text-amber-600" />;
    if (pos === 'FOURTH_PLACE' || pos === 4) return <Star className="w-5 h-5 text-blue-500" />;
    return <Users className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
      {/* Position */}
      <div className="flex items-center gap-2">
        {getPositionIcon(position)}
        <span className="font-medium">{positionName}</span>
      </div>
      
      {/* Points */}
      <div className="flex flex-wrap gap-1">
        {showElo && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
            +{eloReward} ELO
          </Badge>
        )}
        {showSpa && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs">
            +{spaReward.toLocaleString()} SPA
          </Badge>
        )}
      </div>
      
      {/* Cash Prize */}
      <div className="font-medium">
        {showCash && cashPrize ? (
          <span className="text-green-600">{cashPrize.toLocaleString('vi-VN')}₫</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
      
      {/* Physical Items */}
      <div className="text-xs text-muted-foreground">
        {items && items.length > 0 ? items.join(', ') : '-'}
      </div>
    </div>
  );
};

export const TournamentRewards: React.FC<TournamentRewardsProps> = ({ 
  rank, 
  showElo = true, 
  showSpa = true,
  className = "",
  prizeStructure,
  entryFee = 0,
  maxParticipants = 0
}) => {
  const positions = RankingService.getTournamentPositions();
  const hasCashPrizes = prizeStructure && prizeStructure.positions.some(p => p.cashPrize > 0);
  const hasSpecialAwards = prizeStructure && prizeStructure.specialAwards.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Phần thưởng giải đấu - Hạng {rank}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-3 p-2 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
            <div>Vị trí</div>
            <div>Điểm</div>
            <div>Tiền thưởng</div>
            <div>Hiện vật</div>
          </div>
          
          {/* Position Rewards */}
          {prizeStructure ? (
            prizeStructure.positions
              .filter(p => p.isVisible)
              .map((position) => {
                const tournamentPos = positions[position.position - 1];
                const eloReward = RankingService.calculateTournamentElo(tournamentPos);
                const spaReward = RankingService.calculateTournamentSpa(tournamentPos, rank);
                
                return (
                  <RewardRow
                    key={position.position}
                    position={position.position}
                    positionName={position.name}
                    eloReward={eloReward}
                    spaReward={spaReward}
                    cashPrize={position.cashPrize}
                    items={position.items}
                    showElo={showElo}
                    showSpa={showSpa}
                    showCash={prizeStructure.showPrizes}
                  />
                );
              })
          ) : (
            positions.map(position => {
              const eloReward = RankingService.calculateTournamentElo(position);
              const spaReward = RankingService.calculateTournamentSpa(position, rank);
              
              return (
                <RewardRow
                  key={position}
                  position={position}
                  positionName={RankingService.formatPosition(position)}
                  eloReward={eloReward}
                  spaReward={spaReward}
                  showElo={showElo}
                  showSpa={showSpa}
                  showCash={false}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Special Awards */}
      {hasSpecialAwards && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-purple-500" />
              Giải thưởng đặc biệt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prizeStructure!.specialAwards.map((award) => (
              <div key={award.id} className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                <div>
                  <div className="font-medium">{award.name}</div>
                  {award.description && (
                    <div className="text-xs text-muted-foreground">{award.description}</div>
                  )}
                </div>
                <div className="text-green-600 font-medium">
                  {award.cashPrize.toLocaleString('vi-VN')}₫
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {prizeStructure && entryFee > 0 && maxParticipants > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-500" />
              Tổng quan tài chính
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tổng thu:</span>
              <span className="font-medium">
                {(maxParticipants * entryFee).toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div className="flex justify-between">
              <span>Giải thưởng:</span>
              <span className="font-medium">
                {prizeStructure.totalPrize.toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Lợi nhuận CLB:</span>
              <span className={
                (maxParticipants * entryFee - prizeStructure.totalPrize) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }>
                {(maxParticipants * entryFee - prizeStructure.totalPrize).toLocaleString('vi-VN')}₫
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consolidated Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <InfoIcon className="w-4 h-4 text-blue-500" />
            Thông tin điểm thưởng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">ELO</Badge>
              <span>Điểm chính thức, ảnh hưởng trực tiếp đến hạng của bạn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">SPA</Badge>
              <span>Điểm "vui", không ảnh hưởng hạng chính thức nhưng có thể đổi quà</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Hạng</Badge>
              <span>Điểm SPA phụ thuộc vào hạng hiện tại - hạng cao hơn = SPA nhiều hơn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Vị trí</Badge>
              <span>Điểm ELO cố định theo vị trí cuối cùng trong giải đấu</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentRewards;