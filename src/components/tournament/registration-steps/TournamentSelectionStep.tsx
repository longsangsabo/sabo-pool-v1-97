import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { TournamentRegistrationFormData } from '@/schemas/tournamentRegistrationSchema';

interface TournamentSelectionStepProps {
  form: UseFormReturn<TournamentRegistrationFormData>;
  tournaments: any[];
  loading: boolean;
  selectedTournament: any;
  onTournamentSelect: (tournament: any) => void;
}

export const TournamentSelectionStep: React.FC<TournamentSelectionStepProps> = ({
  form,
  tournaments,
  loading,
  selectedTournament,
  onTournamentSelect
}) => {
  const availableTournaments = tournaments.filter(tournament => {
    const now = new Date();
    const regStart = new Date(tournament.registration_start);
    const regEnd = new Date(tournament.registration_end);
    
    return (
      now >= regStart && 
      now <= regEnd && 
      tournament.current_participants < tournament.max_participants &&
      tournament.status === 'upcoming'
    );
  });

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy - HH:mm', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const getTournamentStatus = (tournament: any) => {
    const now = new Date();
    const regStart = new Date(tournament.registration_start);
    const regEnd = new Date(tournament.registration_end);
    const slots = tournament.current_participants;
    const maxSlots = tournament.max_participants;

    if (now < regStart) {
      return { status: 'pending', label: 'Chưa mở đăng ký', color: 'secondary' };
    }
    if (now > regEnd) {
      return { status: 'closed', label: 'Hết hạn đăng ký', color: 'destructive' };
    }
    if (slots >= maxSlots) {
      return { status: 'full', label: 'Đã đủ slot', color: 'destructive' };
    }
    if (slots / maxSlots > 0.8) {
      return { status: 'filling', label: 'Sắp đầy', color: 'warning' };
    }
    return { status: 'open', label: 'Đang mở đăng ký', color: 'success' };
  };

  const handleTournamentSelect = (tournament: any) => {
    onTournamentSelect(tournament);
    form.setValue('tournament_id', tournament.id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Đang tải danh sách giải đấu...</h3>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (availableTournaments.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Không có giải đấu nào đang mở đăng ký</h3>
        <p className="text-muted-foreground mb-4">
          Hiện tại không có giải đấu nào phù hợp để đăng ký. Vui lòng quay lại sau.
        </p>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Các giải đấu mới thường được mở đăng ký vào đầu tuần. 
            Theo dõi thông báo để không bỏ lỡ!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Chọn giải đấu tham gia</h3>
        <p className="text-muted-foreground">
          Có {availableTournaments.length} giải đấu đang mở đăng ký
        </p>
      </div>

      <div className="grid gap-4">
        {availableTournaments.map((tournament) => {
          const isSelected = selectedTournament?.id === tournament.id;
          const status = getTournamentStatus(tournament);

          return (
            <Card 
              key={tournament.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary shadow-lg' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleTournamentSelect(tournament)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {tournament.name}
                      {isSelected && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Level {tournament.tier_level || 1}</Badge>
                      <Badge 
                        variant={status.color as any}
                        className="text-xs"
                      >
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {tournament.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(tournament.tournament_start)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{tournament.venue_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {tournament.current_participants}/{tournament.max_participants} thí sinh
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {tournament.entry_fee?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Đăng ký đến: {formatDateTime(tournament.registration_end)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3 w-3" />
                    <span>Giải thưởng: {tournament.prize_pool?.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {tournament.min_rank_requirement || tournament.max_rank_requirement ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Yêu cầu hạng: {tournament.min_rank_requirement || 'Không giới hạn'} 
                      {tournament.max_rank_requirement && ` - ${tournament.max_rank_requirement}`}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {isSelected && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle className="h-4 w-4" />
                      Đã chọn giải đấu này
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTournament && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Đã chọn:</strong> {selectedTournament.name}. 
            Nhấn "Tiếp tục" để điền thông tin cá nhân.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};