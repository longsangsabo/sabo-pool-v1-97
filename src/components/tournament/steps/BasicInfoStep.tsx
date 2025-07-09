import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, DollarSign } from 'lucide-react';

import { TournamentFormData, TOURNAMENT_TIERS } from '@/schemas/tournamentSchema';
import { TournamentTierSelector } from '@/components/TournamentTierSelector';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';

interface BasicInfoStepProps {
  form: UseFormReturn<TournamentFormData>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form }) => {
  const { register, control, watch, formState: { errors } } = form;
  const selectedTier = watch('tier');

  return (
    <div className="space-y-6">
      {/* Tournament Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Tên giải đấu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="VD: Giải Bida Mở Rộng 2024"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Mô tả giải đấu <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Mô tả chi tiết về giải đấu, quy mô, mục tiêu..."
          rows={4}
          {...register('description')}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Tournament Tier - Enhanced with Database Integration */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Hạng giải <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedTier}
          onValueChange={(value) => form.setValue('tier', value as any)}
        >
          <SelectTrigger className={errors.tier ? 'border-destructive' : ''}>
            <SelectValue placeholder="Chọn hạng giải" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TOURNAMENT_TIERS).map(([key, tier]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{key}</Badge>
                    <div>
                      <p className="font-medium text-sm">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Level {tier.level} • {tier.minFee.toLocaleString('vi-VN')}đ+
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {tier.level === 4 ? 'Pro' : tier.level === 3 ? 'Expert' : tier.level === 2 ? 'Advanced' : 'Basic'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tier && (
          <p className="text-sm text-destructive">{errors.tier.message}</p>
        )}
        {selectedTier && (
          <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].description}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>
                      Phí: {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].minFee.toLocaleString('vi-VN')}đ - {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].maxFee.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Level {TOURNAMENT_TIERS[selectedTier as keyof typeof TOURNAMENT_TIERS].level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tournament_start" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Thời gian bắt đầu <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tournament_start"
            type="datetime-local"
            {...register('tournament_start')}
            className={errors.tournament_start ? 'border-destructive' : ''}
          />
          {errors.tournament_start && (
            <p className="text-sm text-destructive">{errors.tournament_start.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tournament_end" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Thời gian kết thúc <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tournament_end"
            type="datetime-local"
            {...register('tournament_end')}
            className={errors.tournament_end ? 'border-destructive' : ''}
          />
          {errors.tournament_end && (
            <p className="text-sm text-destructive">{errors.tournament_end.message}</p>
          )}
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <Label htmlFor="venue_address" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Địa điểm tổ chức <span className="text-destructive">*</span>
        </Label>
        <Input
          id="venue_address"
          placeholder="VD: CLB Bida Sài Gòn, 123 Nguyễn Huệ, Q1, TP.HCM"
          {...register('venue_address')}
          className={errors.venue_address ? 'border-destructive' : ''}
        />
        {errors.venue_address && (
          <p className="text-sm text-destructive">{errors.venue_address.message}</p>
        )}
      </div>
    </div>
  );
};