import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, DollarSign, Trophy, Clock, Star } from 'lucide-react';
import { TournamentFormData } from '@/types/tournament-extended';
import { EnhancedRewardsDisplay } from './EnhancedRewardsDisplay';

interface TournamentPreviewProps {
  tournament: TournamentFormData;
  onEdit?: () => void;
  className?: string;
}

export const TournamentPreview: React.FC<TournamentPreviewProps> = ({
  tournament,
  onEdit,
  className = ''
}) => {
  if (!tournament || !tournament.name) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Điền thông tin để xem preview giải đấu</p>
        </CardContent>
      </Card>
    );
  }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Preview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl">{tournament.name}</CardTitle>
              {tournament.description && (
                <p className="text-muted-foreground mt-2">{tournament.description}</p>
              )}
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Tournament Type & Status */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {tournament.tournament_type === 'single_elimination' ? 'Loại trực tiếp' : 
               tournament.tournament_type === 'double_elimination' ? 'Loại kép' : 
               tournament.tournament_type === 'round_robin' ? 'Vòng tròn' : 
               tournament.tournament_type}
            </Badge>
            <Badge variant="secondary">
              {tournament.game_format === '8_ball' ? '8 Ball' :
               tournament.game_format === '9_ball' ? '9 Ball' :
               tournament.game_format === '10_ball' ? '10 Ball' :
               tournament.game_format}
            </Badge>
            <Badge variant="outline">
              {tournament.tier_level && `Hạng ${tournament.tier_level}`}
            </Badge>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Bắt đầu</div>
                <div className="text-muted-foreground">{formatDate(tournament.tournament_start)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Kết thúc</div>
                <div className="text-muted-foreground">{formatDate(tournament.tournament_end)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Người tham gia</div>
                <div className="text-muted-foreground">{tournament.max_participants} người</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Phí tham gia</div>
                <div className="text-muted-foreground">{formatCurrency(tournament.entry_fee || 0)}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          {tournament.venue_address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{tournament.venue_address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards Preview */}
      {tournament.rewards && tournament.tier_level && tournament.max_participants && (
        <EnhancedRewardsDisplay
          rewards={tournament.rewards}
          rank={tournament.tier_level as any}
          entryFee={tournament.entry_fee || 0}
          maxParticipants={tournament.max_participants}
          showFinancialSummary={true}
        />
      )}

      {/* Rules & Contact */}
      {(tournament.rules || tournament.contact_info) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin bổ sung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tournament.rules && (
              <div>
                <h4 className="font-medium mb-2">Luật lệ giải đấu</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {tournament.rules}
                </p>
              </div>
            )}
            
            {tournament.contact_info && (
              <div>
                <h4 className="font-medium mb-2">Thông tin liên hệ</h4>
                <p className="text-sm text-muted-foreground">{tournament.contact_info}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Sync Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span>Đồng bộ thời gian thực với form</span>
      </div>
    </div>
  );
};

export default TournamentPreview;