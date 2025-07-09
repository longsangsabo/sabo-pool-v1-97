import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Trophy, Settings, Target } from 'lucide-react';

import { 
  TournamentFormData, 
  PARTICIPANT_SLOTS, 
  TOURNAMENT_FORMATS, 
  GAME_FORMATS,
  TOURNAMENT_TIERS
} from '@/schemas/tournamentSchema';

interface TournamentSettingsStepProps {
  form: UseFormReturn<TournamentFormData>;
}

export const TournamentSettingsStep: React.FC<TournamentSettingsStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const watchedData = watch();
  const selectedTier = watchedData.tier;
  const maxParticipants = watchedData.max_participants;
  const entryFee = watchedData.entry_fee || 0;
  const prizePool = watchedData.prize_pool || 0;

  // Calculate suggested prize pool based on participants and entry fee
  const suggestedPrizePool = maxParticipants * entryFee * 0.8; // 80% of total collected

  const calculatePrizeDistribution = (total: number) => ({
    first: Math.floor(total * 0.5),
    second: Math.floor(total * 0.3),
    third: Math.floor(total * 0.2),
  });

  const prizeDistribution = calculatePrizeDistribution(prizePool);

  return (
    <div className="space-y-6">
      {/* Participants */}
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
            <SelectValue placeholder="Chọn số lượng tham gia" />
          </SelectTrigger>
          <SelectContent>
            {PARTICIPANT_SLOTS.map((slot) => (
              <SelectItem key={slot} value={slot.toString()}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{slot}</Badge>
                  <span>người tham gia</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.max_participants && (
          <p className="text-sm text-destructive">{errors.max_participants.message}</p>
        )}
      </div>

      {/* Tournament Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Hình thức thi đấu <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watchedData.tournament_type}
            onValueChange={(value) => setValue('tournament_type', value as any)}
          >
            <SelectTrigger className={errors.tournament_type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Chọn hình thức" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TOURNAMENT_FORMATS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tournament_type && (
            <p className="text-sm text-destructive">{errors.tournament_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Môn thi đấu <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watchedData.game_format}
            onValueChange={(value) => setValue('game_format', value as any)}
          >
            <SelectTrigger className={errors.game_format ? 'border-destructive' : ''}>
              <SelectValue placeholder="Chọn môn" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GAME_FORMATS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.game_format && (
            <p className="text-sm text-destructive">{errors.game_format.message}</p>
          )}
        </div>
      </div>

      {/* Entry Fee */}
      <div className="space-y-2">
        <Label htmlFor="entry_fee" className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Phí đăng ký (VNĐ) <span className="text-destructive">*</span>
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
          <p className="text-sm text-destructive">{errors.entry_fee.message}</p>
        )}
        {selectedTier && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Phí phù hợp với {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].name}: {' '}
              {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].minFee.toLocaleString('vi-VN')}đ - {' '}
              {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].maxFee.toLocaleString('vi-VN')}đ
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Level {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].level}
              </Badge>
              <span>•</span>
              <span>
                Hệ số SPA: x{TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].level}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Prize Pool */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prize_pool" className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Tổng giải thưởng (VNĐ) <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="prize_pool"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              {...register('prize_pool', { valueAsNumber: true })}
              className={errors.prize_pool ? 'border-destructive' : ''}
            />
            {maxParticipants && entryFee > 0 && (
              <button
                type="button"
                onClick={() => setValue('prize_pool', suggestedPrizePool)}
                className="px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Gợi ý: {suggestedPrizePool.toLocaleString('vi-VN')}đ
              </button>
            )}
          </div>
          {errors.prize_pool && (
            <p className="text-sm text-destructive">{errors.prize_pool.message}</p>
          )}
        </div>

        {/* Prize Distribution Preview */}
        {prizePool > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Phân chia giải thưởng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">1st</Badge>
                  <span className="text-sm">Vô địch (50%)</span>
                </div>
                <span className="font-medium">{prizeDistribution.first.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2nd</Badge>
                  <span className="text-sm">Á quân (30%)</span>
                </div>
                <span className="font-medium">{prizeDistribution.second.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3rd</Badge>
                  <span className="text-sm">Hạng ba (20%)</span>
                </div>
                <span className="font-medium">{prizeDistribution.third.toLocaleString('vi-VN')}đ</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Calculation */}
        {maxParticipants && entryFee > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span>Tổng thu từ phí đăng ký:</span>
              <span className="font-medium">{(maxParticipants * entryFee).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng giải thưởng:</span>
              <span className="font-medium">{prizePool.toLocaleString('vi-VN')}đ</span>
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
    </div>
  );
};