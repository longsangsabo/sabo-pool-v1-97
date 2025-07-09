import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Target,
  Clock
} from 'lucide-react';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';
import { GAME_FORMATS, TOURNAMENT_FORMATS } from '@/schemas/tournamentSchema';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  data,
  onConfirm,
  isSubmitting
}) => {
  const { getTierByLevel } = useTournamentTiers();
  const selectedTier = getTierByLevel(data.tier_level);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Chưa thiết lập';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const calculatePrizeDistribution = (total: number) => ({
    first: Math.floor(total * 0.5),
    second: Math.floor(total * 0.3),
    third: Math.floor(total * 0.2),
  });

  const prizeDistribution = calculatePrizeDistribution(data.prize_pool || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Xác nhận tạo giải đấu
          </DialogTitle>
          <DialogDescription>
            Vui lòng kiểm tra lại thông tin giải đấu trước khi tạo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{data.name || 'Tên giải đấu'}</h3>
            <div className="flex items-center gap-2">
              {selectedTier && (
                <Badge variant="outline">
                  {selectedTier.tier_name}
                </Badge>
              )}
              <Badge>
                {GAME_FORMATS[data.game_format as keyof typeof GAME_FORMATS] || '8-Ball'}
              </Badge>
              <Badge variant="secondary">
                {TOURNAMENT_FORMATS[data.tournament_type as keyof typeof TOURNAMENT_FORMATS] || 'Loại trực tiếp'}
              </Badge>
            </div>
            {data.description && (
              <p className="text-sm text-muted-foreground">{data.description}</p>
            )}
          </div>

          <Separator />

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{data.max_participants}</strong> người tham gia
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Phí tham gia: <strong>{(data.entry_fee || 0).toLocaleString('vi-VN')}đ</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Tổng giải thưởng: <strong>{(data.prize_pool || 0).toLocaleString('vi-VN')}đ</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  <strong>Địa điểm:</strong><br />
                  {data.venue_address || 'Chưa thiết lập'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  <strong>Thời gian:</strong><br />
                  {formatDateTime(data.tournament_start)}
                  {data.tournament_end && (
                    <>
                      <br />đến {formatDateTime(data.tournament_end)}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Prize Distribution */}
          {(data.prize_pool || 0) > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Phân chia giải thưởng</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">1st</Badge>
                    <div className="font-semibold">{prizeDistribution.first.toLocaleString('vi-VN')}đ</div>
                    <div className="text-xs text-muted-foreground">50%</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Badge variant="secondary" className="mb-2">2nd</Badge>
                    <div className="font-semibold">{prizeDistribution.second.toLocaleString('vi-VN')}đ</div>
                    <div className="text-xs text-muted-foreground">30%</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Badge variant="outline" className="mb-2">3rd</Badge>
                    <div className="font-semibold">{prizeDistribution.third.toLocaleString('vi-VN')}đ</div>
                    <div className="text-xs text-muted-foreground">20%</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Financial Summary */}
          {data.max_participants && data.entry_fee && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Tóm tắt tài chính</h4>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng thu từ phí đăng ký:</span>
                    <span className="font-medium">
                      {(data.max_participants * data.entry_fee).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng giải thưởng:</span>
                    <span className="font-medium">
                      {(data.prize_pool || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Lợi nhuận dự kiến:</span>
                    <span className={
                      data.max_participants * data.entry_fee - (data.prize_pool || 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }>
                      {(data.max_participants * data.entry_fee - (data.prize_pool || 0)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Quay lại chỉnh sửa
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Xác nhận tạo giải đấu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};