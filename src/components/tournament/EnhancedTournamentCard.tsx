import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TournamentRewardsButton } from './TournamentRewardsButton';
import { RankingService } from '@/services/rankingService';
import { TOURNAMENT_STATUS } from '@/constants/tournamentConstants';
import type { RankCode } from '@/utils/eloConstants';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  Star,
  DollarSign,
  Eye
} from 'lucide-react';

interface EnhancedTournamentCardProps {
  tournament: {
    id: string;
    name: string;
    description?: string;
    status: string;
    tournament_type: string;
    game_format: string;
    max_participants: number;
    current_participants: number;
    entry_fee: number;
    prize_pool: number;
    tournament_start: string;
    tournament_end?: string;
    registration_start?: string;
    registration_end?: string;
    venue_name?: string;
    venue_address?: string;
    banner_image?: string;
  };
  playerRank?: RankCode;
  onView?: (tournamentId: string) => void;
  onRegister?: (tournamentId: string) => void;
  isRegistered?: boolean;
  className?: string;
}

export const EnhancedTournamentCard: React.FC<EnhancedTournamentCardProps> = ({
  tournament,
  playerRank = 'K',
  onView,
  onRegister,
  isRegistered = false,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case TOURNAMENT_STATUS.UPCOMING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return 'bg-green-100 text-green-800 border-green-200';
      case TOURNAMENT_STATUS.REGISTRATION_CLOSED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TOURNAMENT_STATUS.ONGOING:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case TOURNAMENT_STATUS.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case TOURNAMENT_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case TOURNAMENT_STATUS.UPCOMING:
        return 'Sắp diễn ra';
      case TOURNAMENT_STATUS.REGISTRATION_OPEN:
        return 'Đang mở đăng ký';
      case TOURNAMENT_STATUS.REGISTRATION_CLOSED:
        return 'Đã đóng đăng ký';
      case TOURNAMENT_STATUS.ONGOING:
        return 'Đang thi đấu';
      case TOURNAMENT_STATUS.COMPLETED:
        return 'Đã kết thúc';
      case TOURNAMENT_STATUS.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Calculate participation percentage
  const participationPercentage = (tournament.current_participants / tournament.max_participants) * 100;

  // Quick rewards preview
  const championRewards = RankingService.calculateTournamentRewards('CHAMPION', playerRank);
  const top8Rewards = RankingService.calculateTournamentRewards('TOP_8', playerRank);

  const canRegister = tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN && 
                     tournament.current_participants < tournament.max_participants &&
                     !isRegistered;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className}`}>
      {/* Banner Image */}
      {tournament.banner_image && (
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 relative overflow-hidden">
          <img
            src={tournament.banner_image}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={getStatusColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        {!tournament.banner_image && (
          <div className="flex justify-between items-start mb-2">
            <Badge className={getStatusColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
          </div>
        )}
        <CardTitle className="text-lg line-clamp-2">{tournament.name}</CardTitle>
        {tournament.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tournament.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tournament Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs">{formatDate(tournament.tournament_start)}</span>
          </div>
          
          {tournament.venue_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs truncate">{tournament.venue_address}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs">
              {tournament.current_participants}/{tournament.max_participants}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-primary">
              {formatPrize(tournament.prize_pool)}
            </span>
          </div>
        </div>

        {/* Participation Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Người tham gia</span>
            <span>{Math.round(participationPercentage)}%</span>
          </div>
          <Progress value={participationPercentage} className="h-2" />
        </div>

        {/* Prize Distribution */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-primary">Phần thưởng tiền mặt</h4>
            <Badge variant="outline" className="text-xs">
              {formatPrize(tournament.prize_pool)}
            </Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                Nhất
              </span>
              <span className="font-medium">{formatPrize(tournament.prize_pool * 0.5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-gray-400" />
                Nhì
              </span>
              <span className="font-medium">{formatPrize(tournament.prize_pool * 0.3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-600" />
                Ba
              </span>
              <span className="font-medium">{formatPrize(tournament.prize_pool * 0.2)}</span>
            </div>
          </div>
          
          {/* ELO Points Preview */}
          <div className="mt-3 pt-2 border-t border-primary/20">
            <h5 className="text-xs font-medium text-primary mb-1">Điểm ELO dự kiến (Rank {playerRank})</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Vô địch:</span>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{championRewards.eloPoints}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-green-500" />
                <span>Top 8:</span>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{top8Rewards.eloPoints}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Info */}
        {tournament.status === TOURNAMENT_STATUS.REGISTRATION_OPEN && tournament.registration_end && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Đóng đăng ký: {formatDate(tournament.registration_end)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(tournament.id)}
            className="gap-1"
          >
            <Eye className="w-3 h-3" />
            Chi tiết
          </Button>
          
          <TournamentRewardsButton 
            playerRank={playerRank}
            size="sm"
            variant="outline"
          />

          {canRegister ? (
            <Button
              size="sm"
              onClick={() => onRegister?.(tournament.id)}
              className="gap-1"
            >
              <DollarSign className="w-3 h-3" />
              {tournament.entry_fee > 0 ? formatPrize(tournament.entry_fee) : 'Miễn phí'}
            </Button>
          ) : isRegistered ? (
            <Button size="sm" variant="secondary" disabled>
              Đã đăng ký
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled>
              Không thể đăng ký
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTournamentCard;