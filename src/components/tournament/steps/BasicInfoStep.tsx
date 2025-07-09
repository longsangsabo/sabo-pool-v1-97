
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin } from 'lucide-react';

import { TournamentFormData } from '@/schemas/tournamentSchema';
import { TournamentTierSelector } from '@/components/TournamentTierSelector';

interface BasicInfoStepProps {
  form: UseFormReturn<TournamentFormData>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form }) => {
  const { register, control, watch, setValue, formState: { errors } } = form;
  const selectedTierLevel = watch('tier_level');

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

      {/* Tournament Tier - Database Driven */}
      <div className="space-y-2">
        <TournamentTierSelector
          value={selectedTierLevel}
          onValueChange={(tierLevel) => setValue('tier_level', tierLevel)}
          showSPAPreview={true}
        />
        {errors.tier_level && (
          <p className="text-sm text-destructive">{errors.tier_level.message}</p>
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
