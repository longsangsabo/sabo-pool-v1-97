import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Star, Users, Gift, DollarSign, InfoIcon, Edit } from 'lucide-react';
import { TournamentRewards as TournamentRewardsType } from '@/types/tournament-extended';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

interface TournamentRewardsProps {
  rewards: TournamentRewardsType;
  rank?: RankCode;
  showElo?: boolean;
  showSpa?: boolean;
  className?: string;
  entryFee?: number;
  maxParticipants?: number;
  onEdit?: () => void;
  isEditable?: boolean;
}

const PositionIcon = ({ position }: { position: number }) => {
  const iconMap: Record<number, React.ReactNode> = {
    1: <Trophy className="w-5 h-5 text-yellow-500" />,
    2: <Medal className="w-5 h-5 text-gray-400" />,
    3: <Award className="w-5 h-5 text-amber-600" />,
    4: <Star className="w-5 h-5 text-blue-500" />,
    8: <Users className="w-5 h-5 text-green-500" />,
    16: <Users className="w-5 h-5 text-purple-500" />,
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
  position: number;
  positionName: string;
  eloReward: number;
  spaReward: number;
  cashPrize?: number;
  items?: string[];
  showElo: boolean;
  showSpa: boolean;
  showCash: boolean;
}) => {
  return (
    <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
      {/* Position */}
      <div className="flex items-center gap-2">
        <PositionIcon position={position} />
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
  rewards,
  rank,
  showElo = true, 
  showSpa = true,
  className = "",
  entryFee = 0,
  maxParticipants = 0,
  onEdit,
  isEditable = false,
}) => {
  const hasCashPrizes = rewards?.showPrizes && rewards.positions?.some(p => p.cashPrize > 0);
  const hasSpecialAwards = rewards?.specialAwards?.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Phần thưởng giải đấu{rank && ` - Hạng ${rank}`}
            </div>
            {isEditable && onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
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
          {rewards.positions
            .filter(p => p.isVisible)
            .map((position) => (
              <RewardRow
                key={position.position}
                position={position.position}
                positionName={position.name}
                eloReward={position.eloPoints}
                spaReward={position.spaPoints}
                cashPrize={position.cashPrize}
                items={position.items}
                showElo={showElo}
                showSpa={showSpa}
                showCash={rewards.showPrizes}
              />
            ))}
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
            {rewards.specialAwards.map((award) => (
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
      {rewards.showPrizes && entryFee > 0 && maxParticipants > 0 && (
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
                {rewards.totalPrize.toLocaleString('vi-VN')}₫
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Lợi nhuận CLB:</span>
              <span className={
                (maxParticipants * entryFee - rewards.totalPrize) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }>
                {(maxParticipants * entryFee - rewards.totalPrize).toLocaleString('vi-VN')}₫
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