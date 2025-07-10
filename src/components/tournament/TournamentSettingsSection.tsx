import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Info, Users, Trophy, Gamepad2, DollarSign, Medal } from 'lucide-react';
import { TournamentFormData } from '@/types/tournament-extended';
import { TournamentType, GameFormat } from '@/types/tournament-enums';
import { PARTICIPANT_SLOTS, TOURNAMENT_FORMATS, GAME_FORMATS } from '@/schemas/tournamentSchema';

interface TournamentSettingsSectionProps {
  form: UseFormReturn<TournamentFormData>;
}

export const TournamentSettingsSection: React.FC<TournamentSettingsSectionProps> = ({ form }) => {
  const { register, setValue, watch, formState: { errors } } = form;
  const watchedData = watch();

  // Calculate estimated duration based on participants and format
  const getEstimatedDuration = (participants: number, format: TournamentType): string => {
    const baseTime = {
      [TournamentType.SINGLE_ELIMINATION]: participants * 30, // 30 minutes per participant
      [TournamentType.DOUBLE_ELIMINATION]: participants * 45, // 45 minutes per participant
      [TournamentType.ROUND_ROBIN]: participants * participants * 15, // More complex calculation
      [TournamentType.SWISS]: participants * 40, // 40 minutes per participant
    };

    const minutes = baseTime[format] || participants * 30;
    const hours = Math.ceil(minutes / 60);
    
    if (hours < 24) {
      return `~${hours} giờ`;
    } else {
      const days = Math.ceil(hours / 24);
      return `~${days} ngày`;
    }
  };

  // Auto-calculate prize pool based on entry fee and participants
  const calculatePrizePool = (entryFee: number, participants: number): number => {
    return Math.round(entryFee * participants * 0.75); // 75% goes to prizes
  };

  const handleParticipantsChange = (value: string) => {
    const participants = parseInt(value);
    setValue('max_participants', participants, { shouldValidate: true });
    
    // Auto-update prize pool if entry fee is set
    if (watchedData.entry_fee && watchedData.entry_fee > 0) {
      const newPrizePool = calculatePrizePool(watchedData.entry_fee, participants);
      setValue('prize_pool', newPrizePool, { shouldValidate: true });
    }
  };

  const handleEntryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const entryFee = parseFloat(e.target.value) || 0;
    setValue('entry_fee', entryFee, { shouldValidate: true });
    
    // Auto-update prize pool if participants is set
    if (watchedData.max_participants) {
      const newPrizePool = calculatePrizePool(entryFee, watchedData.max_participants);
      setValue('prize_pool', newPrizePool, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Participants Configuration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <Label className="text-sm font-medium">Số người tham gia</Label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PARTICIPANT_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => handleParticipantsChange(slot.toString())}
              className={`p-3 border rounded-lg text-center transition-all ${
                watchedData.max_participants === slot
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="text-lg font-semibold">{slot}</div>
              <div className="text-xs text-muted-foreground">người</div>
            </button>
          ))}
        </div>
        
        {errors.max_participants && (
          <p className="text-sm text-destructive">{String(errors.max_participants.message)}</p>
        )}
        
        {watchedData.max_participants && watchedData.tournament_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              Thời gian ước tính: {getEstimatedDuration(watchedData.max_participants, watchedData.tournament_type)}
            </span>
          </div>
        )}
      </div>

      {/* Tournament Format */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <Label className="text-sm font-medium">Hình thức thi đấu</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(TOURNAMENT_FORMATS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setValue('tournament_type', key as TournamentType, { shouldValidate: true })}
              className={`p-4 border rounded-lg text-left transition-all ${
                watchedData.tournament_type === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {key === 'single_elimination' && 'Thua 1 trận là bị loại'}
                {key === 'double_elimination' && 'Có cơ hội phục hồi'}
                {key === 'round_robin' && 'Đấu vòng tròn tất cả'}
                {key === 'swiss' && 'Đấu với đối thủ cùng điểm'}
              </div>
            </button>
          ))}
        </div>
        
        {errors.tournament_type && (
          <p className="text-sm text-destructive">{String(errors.tournament_type.message)}</p>
        )}
      </div>

      {/* Game Format */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4" />
          <Label className="text-sm font-medium">Môn thi đấu</Label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(GAME_FORMATS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setValue('game_format', key as GameFormat, { shouldValidate: true })}
              className={`p-3 border rounded-lg text-center transition-all ${
                watchedData.game_format === key
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {key === '9_ball' && 'Phổ biến nhất'}
                {key === '8_ball' && 'Dễ chơi'}
                {key === '10_ball' && 'Chuyên nghiệp'}
                {key === 'straight_pool' && 'Kỹ thuật cao'}
              </div>
            </button>
          ))}
        </div>
        
        {errors.game_format && (
          <p className="text-sm text-destructive">{String(errors.game_format.message)}</p>
        )}
      </div>

      {/* Third Place Match Setting - Only for Single Elimination */}
      {watchedData.tournament_type === 'single_elimination' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            <Label className="text-sm font-medium">Cài đặt nâng cao</Label>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium text-sm">Trận tranh hạng 3</div>
              <div className="text-xs text-muted-foreground">
                Tạo trận đấu cho 2 người thua bán kết để tranh hạng 3
              </div>
            </div>
            <Switch
              checked={watchedData.has_third_place_match ?? true}
              onCheckedChange={(checked) => setValue('has_third_place_match', checked, { shouldValidate: true })}
            />
          </div>
          
          {watchedData.has_third_place_match && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
              <Info className="h-4 w-4" />
              <span>Trận tranh hạng 3 sẽ được tự động tạo khi hoàn thành bán kết</span>
            </div>
          )}
        </div>
      )}

      {/* Financial Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <Label className="text-sm font-medium">Cài đặt tài chính</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Entry Fee */}
          <div className="space-y-2">
            <Label htmlFor="entry_fee" className="text-sm">
              Phí đăng ký (VNĐ)
            </Label>
            <Input
              id="entry_fee"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              {...register('entry_fee', { valueAsNumber: true })}
              onChange={handleEntryFeeChange}
              className={errors.entry_fee ? 'border-destructive' : ''}
            />
            {errors.entry_fee && (
              <p className="text-sm text-destructive">{String(errors.entry_fee.message)}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Để 0 nếu là giải đấu miễn phí
            </p>
          </div>

          {/* Prize Pool */}
          <div className="space-y-2">
            <Label htmlFor="prize_pool" className="text-sm">
              Tổng giải thưởng (VNĐ)
            </Label>
            <div className="relative">
              <Input
                id="prize_pool"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                {...register('prize_pool', { valueAsNumber: true })}
                className={errors.prize_pool ? 'border-destructive' : ''}
              />
              {watchedData.entry_fee && watchedData.max_participants && (
                <Badge 
                  variant="secondary" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                >
                  Auto: {calculatePrizePool(watchedData.entry_fee, watchedData.max_participants).toLocaleString()}₫
                </Badge>
              )}
            </div>
            {errors.prize_pool && (
              <p className="text-sm text-destructive">{String(errors.prize_pool.message)}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Tự động tính 75% tổng phí đăng ký
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        {watchedData.entry_fee && watchedData.max_participants && watchedData.entry_fee > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Tóm tắt tài chính</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tổng thu</div>
                <div className="font-medium">
                  {(watchedData.entry_fee * watchedData.max_participants).toLocaleString()}₫
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Giải thưởng</div>
                <div className="font-medium">
                  {(watchedData.prize_pool || 0).toLocaleString()}₫
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Lợi nhuận CLB</div>
                <div className={`font-medium ${
                  (watchedData.entry_fee * watchedData.max_participants - (watchedData.prize_pool || 0)) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {(watchedData.entry_fee * watchedData.max_participants - (watchedData.prize_pool || 0)).toLocaleString()}₫
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};