import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Target,
  Settings,
  Shield,
  FileText,
  Phone,
  Eye,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { 
  TournamentFormData, 
  TOURNAMENT_FORMATS, 
  GAME_FORMATS 
} from '@/schemas/tournamentSchema';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';

interface PreviewStepProps {
  form: UseFormReturn<TournamentFormData>;
  onSubmit: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ form, onSubmit }) => {
  const watchedData = form.watch();
  const { getTierByLevel } = useTournamentTiers();
  
  const selectedTier = watchedData.tier_level ? getTierByLevel(watchedData.tier_level) : null;

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy - HH:mm', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const calculatePrizeDistribution = (total: number) => ({
    first: Math.floor(total * 0.5),
    second: Math.floor(total * 0.3),
    third: Math.floor(total * 0.2),
  });

  const prizeDistribution = calculatePrizeDistribution(watchedData.prize_pool || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Xem trước giải đấu</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Kiểm tra thông tin trước khi tạo giải đấu
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {watchedData.name}
            {selectedTier && (
              <Badge variant="secondary">{selectedTier.tier_name}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{watchedData.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Thời gian diễn ra</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(watchedData.tournament_start || '')} - {formatDateTime(watchedData.tournament_end || '')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Địa điểm</p>
                  <p className="text-sm text-muted-foreground">{watchedData.venue_address}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Số lượng tham gia</p>
                  <p className="text-sm text-muted-foreground">{watchedData.max_participants} người</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phí đăng ký</p>
                  <p className="text-sm text-muted-foreground">
                    {(watchedData.entry_fee || 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Môn thi đấu</p>
                <p className="text-sm text-muted-foreground">
                  {GAME_FORMATS[watchedData.game_format as keyof typeof GAME_FORMATS]}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Hình thức</p>
                <p className="text-sm text-muted-foreground">
                  {TOURNAMENT_FORMATS[watchedData.tournament_type as keyof typeof TOURNAMENT_FORMATS]}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Prize Pool */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Giải thưởng: {(watchedData.prize_pool || 0).toLocaleString('vi-VN')}đ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">1st</Badge>
                <p className="text-sm font-medium">Vô địch</p>
                <p className="text-lg font-bold text-yellow-600">
                  {prizeDistribution.first.toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
                <Badge variant="secondary" className="mb-2">2nd</Badge>
                <p className="text-sm font-medium">Á quân</p>
                <p className="text-lg font-bold text-gray-600">
                  {prizeDistribution.second.toLocaleString('vi-VN')}đ
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border">
                <Badge variant="outline" className="mb-2">3rd</Badge>
                <p className="text-sm font-medium">Hạng ba</p>
                <p className="text-lg font-bold text-amber-600">
                  {prizeDistribution.third.toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Đăng ký tham gia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mở đăng ký</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(watchedData.registration_start || '')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Đóng đăng ký</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(watchedData.registration_end || '')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {watchedData.is_public && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Công khai
              </Badge>
            )}
            {watchedData.requires_approval && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Cần phê duyệt
              </Badge>
            )}
            {watchedData.min_rank_requirement && (
              <Badge variant="outline">
                Tối thiểu: {watchedData.min_rank_requirement}
              </Badge>
            )}
            {watchedData.max_rank_requirement && (
              <Badge variant="outline">
                Tối đa: {watchedData.max_rank_requirement}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(watchedData.rules || watchedData.contact_info) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông tin bổ sung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedData.rules && (
              <div>
                <h5 className="font-medium mb-2">Luật lệ giải đấu</h5>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {watchedData.rules}
                </p>
              </div>
            )}
            
            {watchedData.contact_info && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Liên hệ</p>
                  <p className="text-sm text-muted-foreground">{watchedData.contact_info}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation */}
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">Sẵn sàng tạo giải đấu?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sau khi tạo, giải đấu sẽ được công bố và mở đăng ký theo lịch trình đã định.
          </p>
          <Button 
            onClick={onSubmit}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            🏆 Tạo giải đấu ngay
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};