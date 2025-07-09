import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Users, Gift } from 'lucide-react';
import { RankingService } from '@/services/rankingService';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

interface TournamentRewardsProps {
  rank: RankCode;
  showElo?: boolean;
  showSpa?: boolean;
  className?: string;
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

const RewardItem = ({ 
  position, 
  eloReward, 
  spaReward, 
  showElo, 
  showSpa 
}: {
  position: TournamentPosition;
  eloReward: number;
  spaReward: number;
  showElo: boolean;
  showSpa: boolean;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
    <div className="flex items-center gap-3">
      <PositionIcon position={position} />
      <span className="font-medium text-foreground">
        {RankingService.formatPosition(position)}
      </span>
    </div>
    
    <div className="flex items-center gap-2">
      {showElo && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          +{eloReward} ELO
        </Badge>
      )}
      {showSpa && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
          +{spaReward.toLocaleString()} SPA
        </Badge>
      )}
    </div>
  </div>
);

export const TournamentRewards: React.FC<TournamentRewardsProps> = ({ 
  rank, 
  showElo = true, 
  showSpa = true,
  className = ""
}) => {
  const positions = RankingService.getTournamentPositions();

  return (
    <Card className={`tournament-rewards-container ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Phần thưởng dự kiến
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Điểm thưởng cho hạng {rank} trong giải đấu
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {positions.map(position => {
          const eloReward = RankingService.calculateTournamentElo(position);
          const spaReward = RankingService.calculateTournamentSpa(position, rank);
          
          return (
            <RewardItem
              key={position}
              position={position}
              eloReward={eloReward}
              spaReward={spaReward}
              showElo={showElo}
              showSpa={showSpa}
            />
          );
        })}
        
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium text-primary mb-2">Lưu ý:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ELO: Điểm chính thức, ảnh hưởng đến hạng</li>
            <li>• SPA: Điểm "vui", không ảnh hưởng hạng chính thức</li>
            <li>• Điểm SPA phụ thuộc vào hạng hiện tại của bạn</li>
            <li>• Điểm ELO cố định theo vị trí cuối cùng</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentRewards;