import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Trophy, Settings, Target } from 'lucide-react';
import { PARTICIPANT_SLOTS, TOURNAMENT_FORMATS, GAME_FORMATS } from '@/schemas/tournamentSchema';

interface TournamentSettingsSectionProps {
  form: UseFormReturn<any>;
}

export const TournamentSettingsSection: React.FC<TournamentSettingsSectionProps> = ({ form }) => {
  const { register, setValue, watch, formState: { errors } } = form;
  const watchedData = watch();

  const maxParticipants = watchedData.max_participants;
  const entryFee = watchedData.entry_fee || 0;
  const prizePool = watchedData.prize_pool || 0;

  // Calculate suggested prize pool
  const suggestedPrizePool = maxParticipants * entryFee * 0.8;

  return (
    <div className="space-y-4">
      {/* Participants and Fee - Essential Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Số lượng tham gia <span className="text-destructive">*</span>
          </Label>
          <Select
            value={maxParticipants?.toString()}
            onValueChange={(value) => setValue('max_participants', parseInt(value))}
          >
            <SelectTrigger className={errors.max_participants ? 'border-destructive' : ''}>
              <SelectValue placeholder="Chọn số lượng" />
            </SelectTrigger>
            <SelectContent>
              {PARTICIPANT_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot.toString()}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{slot}</Badge>
                    <span>người</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.max_participants && (
            <p className="text-sm text-destructive">{String(errors.max_participants.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_fee" className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Phí tham gia (VNĐ) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="entry_fee"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            {...register('entry_fee', { valueAsNumber: true })}
            className={errors.entry_fee ? 'border-destructive' : ''}
          />
          {errors.entry_fee && (
            <p className="text-sm text-destructive">{String(errors.entry_fee.message)}</p>
          )}
        </div>
      </div>

      {/* Prize Pool */}
      <div className="space-y-2">
        <Label htmlFor="prize_pool" className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Tổng giải thưởng (VNĐ)
        </Label>
        <div className="flex gap-2">
          <Input
            id="prize_pool"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            {...register('prize_pool', { valueAsNumber: true })}
          />
          {maxParticipants && entryFee > 0 && (
            <button
              type="button"
              onClick={() => setValue('prize_pool', suggestedPrizePool)}
              className="px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors whitespace-nowrap"
            >
              Gợi ý: {suggestedPrizePool.toLocaleString('vi-VN')}đ
            </button>
          )}
        </div>
        {maxParticipants && entryFee > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Tổng thu:</span>
              <span>{(maxParticipants * entryFee).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between">
              <span>Giải thưởng:</span>
              <span>{prizePool.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Lợi nhuận:</span>
              <span className={maxParticipants * entryFee - prizePool >= 0 ? 'text-green-600' : 'text-red-600'}>
                {(maxParticipants * entryFee - prizePool).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tournament Format - Optional with defaults */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Hình thức thi đấu
          </Label>
          <Select
            value={watchedData.tournament_type}
            onValueChange={(value) => setValue('tournament_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Loại trực tiếp" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TOURNAMENT_FORMATS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Môn thi đấu
          </Label>
          <Select
            value={watchedData.game_format}
            onValueChange={(value) => setValue('game_format', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="8-Ball" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GAME_FORMATS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prize Distribution Preview */}
      {prizePool > 0 && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <h4 className="text-sm font-medium">Phân chia giải thưởng</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-xs">1st</Badge>
              <div className="mt-1">{Math.floor(prizePool * 0.5).toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">2nd</Badge>
              <div className="mt-1">{Math.floor(prizePool * 0.3).toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">3rd</Badge>
              <div className="mt-1">{Math.floor(prizePool * 0.2).toLocaleString('vi-VN')}đ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};