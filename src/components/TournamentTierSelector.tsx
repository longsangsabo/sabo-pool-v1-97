
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Trophy, Users, DollarSign, Star } from 'lucide-react';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';

interface TournamentTierSelectorProps {
  value?: number;
  onValueChange: (tierLevel: number) => void;
  showSPAPreview?: boolean;
}

export const TournamentTierSelector: React.FC<TournamentTierSelectorProps> = ({
  value,
  onValueChange,
  showSPAPreview = true
}) => {
  const { tiers, getTierSPABreakdown, getSuggestedEntryFees, isLoading } = useTournamentTiers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        {showSPAPreview && <div className="h-40 bg-muted animate-pulse rounded" />}
      </div>
    );
  }

  const selectedTier = tiers?.find(t => t.tier_level === value);
  const spaBreakdown = value ? getTierSPABreakdown(value) : null;
  const suggestedFees = value ? getSuggestedEntryFees(value) : null;

  return (
    <div className="space-y-4">
      {/* Tier Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Hạng giải đấu</label>
        <Select 
          value={value?.toString()} 
          onValueChange={(val) => onValueChange(parseInt(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn hạng giải đấu" />
          </SelectTrigger>
          <SelectContent>
            {tiers?.map((tier) => (
              <SelectItem key={tier.id} value={tier.tier_level.toString()}>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{tier.tier_name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    x{tier.points_multiplier} điểm
                  </span>
                  {tier.qualification_required && (
                    <Star className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTier && (
          <p className="text-xs text-muted-foreground">
            {selectedTier.description}
            {selectedTier.qualification_required && (
              <span className="text-yellow-600 ml-1">(Yêu cầu qualification)</span>
            )}
          </p>
        )}
      </div>

      {/* Tier Details & SPA Preview */}
      {selectedTier && showSPAPreview && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tier Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Thông tin giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cấp độ:</span>
                <Badge variant="outline">{selectedTier.tier_name}</Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hệ số điểm:</span>
                <span className="font-medium">x{selectedTier.points_multiplier}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tối thiểu:</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{selectedTier.min_participants} người</span>
                </div>
              </div>

              {suggestedFees && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí đề xuất:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">
                      {suggestedFees.min.toLocaleString('vi-VN')} - {suggestedFees.max.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SPA Points Breakdown */}
          {spaBreakdown && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Điểm SPA dự kiến
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {spaBreakdown.breakdown.slice(0, 6).map((item, index) => {
                  const getPositionIcon = (position: string) => {
                    if (position === 'champion') return '🏆';
                    if (position === 'runner_up') return '🥈';
                    if (position === 'semi_finalist') return '🥉';
                    return '⭐';
                  };

                  const getPositionLabel = (position: string) => {
                    const labels: Record<string, string> = {
                      champion: 'Vô địch',
                      runner_up: 'Á quân',
                      semi_finalist: 'Hạng 3',
                      quarter_finalist: 'Hạng 4',
                      top_16: 'Top 8',
                      top_32: 'Top 16',
                      participation: 'Tham gia'
                    };
                    return labels[position] || position;
                  };

                  return (
                    <div key={item.position} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getPositionIcon(item.position)}</span>
                        <span className="text-xs">{getPositionLabel(item.position)}</span>
                      </div>
                      <Badge 
                        variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        +{item.points} SPA
                      </Badge>
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  * Tham gia: +{spaBreakdown.breakdown.find(b => b.position === 'participation')?.points || 0} SPA
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
