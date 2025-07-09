import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Target,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';
import { GAME_FORMATS, TOURNAMENT_FORMATS } from '@/schemas/tournamentSchema';

interface SimplifiedTournamentPreviewProps {
  data: any;
  errors: any;
}

export const SimplifiedTournamentPreview: React.FC<SimplifiedTournamentPreviewProps> = ({
  data,
  errors
}) => {
  const { getTierByLevel } = useTournamentTiers();
  const selectedTier = getTierByLevel(data.tier_level);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Chưa chọn';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const calculatePrizeDistribution = (total: number) => ({
    first: Math.floor(total * 0.5),
    second: Math.floor(total * 0.3),
    third: Math.floor(total * 0.2),
  });

  const prizeDistribution = calculatePrizeDistribution(data.prize_pool || 0);

  const getEligibleRanksDisplay = () => {
    if (data.allow_all_ranks) return 'Tất cả hạng';
    if (!data.eligible_ranks || data.eligible_ranks.length === 0) return 'Chưa chọn hạng';
    
    // Check for continuous ranges
    const sortedRanks = [...data.eligible_ranks].sort((a, b) => {
      const ranks = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'];
      return ranks.indexOf(a) - ranks.indexOf(b);
    });
    
    return sortedRanks.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Xem trước giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Tournament Name */}
          <div>
            <h3 className="font-semibold text-lg">{data.name || 'Tên giải đấu'}</h3>
            {selectedTier && (
              <Badge variant="outline" className="mt-1">
                {selectedTier.tier_name}
              </Badge>
            )}
          </div>

          {/* Key Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{data.max_participants || 0} người tham gia</span>
              {data.max_participants ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Phí: {(data.entry_fee || 0).toLocaleString('vi-VN')}đ</span>
              {data.entry_fee ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{data.venue_address || 'Chưa chọn địa điểm'}</span>
              {data.venue_address ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{formatDateTime(data.tournament_start)}</span>
              {data.tournament_start ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>
                {GAME_FORMATS[data.game_format as keyof typeof GAME_FORMATS] || '8-Ball'} - {' '}
                {TOURNAMENT_FORMATS[data.tournament_type as keyof typeof TOURNAMENT_FORMATS] || 'Loại trực tiếp'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">Hạng: {getEligibleRanksDisplay()}</span>
              {(data.allow_all_ranks || (data.eligible_ranks && data.eligible_ranks.length > 0)) ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <AlertCircle className="h-4 w-4 text-orange-500" />
              }
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Prize Pool Preview */}
      {(data.prize_pool || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Giải thưởng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-bold text-center mb-3">
              {(data.prize_pool || 0).toLocaleString('vi-VN')}đ
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">1st</Badge>
                  <span>Vô địch</span>
                </div>
                <span className="font-medium">{prizeDistribution.first.toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2nd</Badge>
                  <span>Á quân</span>
                </div>
                <span className="font-medium">{prizeDistribution.second.toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3rd</Badge>
                  <span>Hạng 3</span>
                </div>
                <span className="font-medium">{prizeDistribution.third.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {data.max_participants && data.entry_fee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tóm tắt tài chính</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tổng thu:</span>
              <span className="font-medium">
                {(data.max_participants * data.entry_fee).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between">
              <span>Giải thưởng:</span>
              <span className="font-medium">
                {(data.prize_pool || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Lợi nhuận:</span>
              <span className={
                data.max_participants * data.entry_fee - (data.prize_pool || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }>
                {(data.max_participants * data.entry_fee - (data.prize_pool || 0)).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPA/ELO Rewards Preview */}
      {selectedTier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Điểm thưởng dự kiến</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="text-center text-muted-foreground">
              Hệ số SPA: x{selectedTier.points_multiplier}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">Vô địch</div>
                <div className="text-primary">~500 SPA</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">Tham gia</div>
                <div className="text-primary">~100 SPA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            {Object.keys(errors).length === 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            Trạng thái xác thực
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(errors).length === 0 ? (
            <p className="text-sm text-green-600">Tất cả thông tin đã hợp lệ</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-orange-600">Cần kiểm tra:</p>
              <ul className="text-xs space-y-1">
                {Object.entries(errors).slice(0, 3).map(([field, error]: [string, any]) => (
                  <li key={field} className="text-muted-foreground">
                    • {error?.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};