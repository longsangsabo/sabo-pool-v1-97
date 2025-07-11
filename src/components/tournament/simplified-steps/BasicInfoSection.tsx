import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, MapPin, Trophy, Building2 } from 'lucide-react';
import { TournamentTierSelector } from '@/components/TournamentTierSelector';
import { RankSelector } from '@/components/tournament/RankSelector';
import { useProfileContext } from '@/contexts/ProfileContext';
import { toast } from 'sonner';

interface BasicInfoSectionProps {
  form: UseFormReturn<any>;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ form }) => {
  const { register, setValue, watch, formState: { errors } } = form;
  const selectedTierLevel = watch('tier_level');
  const { clubProfile } = useProfileContext();

  // Function to auto-fill club address
  const fillClubAddress = () => {
    if (clubProfile && clubProfile.address) {
      const fullAddress = `${clubProfile.club_name}, ${clubProfile.address}`;
      setValue('venue_address', fullAddress, { shouldValidate: true, shouldDirty: true });
      toast.success('Đã điền địa chỉ CLB thành công');
    } else {
      toast.error('Không tìm thấy địa chỉ CLB trong hồ sơ của bạn');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tournament Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Tên giải đấu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="VD: Giải Bida Mở Rộng 2024"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{String(errors.name.message)}</p>
        )}
      </div>

      {/* Tournament Tier */}
      <div className="space-y-2">
        <TournamentTierSelector
          value={selectedTierLevel}
          onValueChange={(tierLevel) => setValue('tier_level', tierLevel)}
          showSPAPreview={false}
          
        />
        {errors.tier_level && (
          <p className="text-sm text-destructive">{String(errors.tier_level.message)}</p>
        )}
      </div>

      {/* Rank Eligibility */}
      <RankSelector form={form} />

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
            <p className="text-sm text-destructive">{String(errors.tournament_start.message)}</p>
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
            <p className="text-sm text-destructive">{String(errors.tournament_end.message)}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Thời gian sẽ được tự động tính dựa trên số người tham gia
          </p>
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <Label htmlFor="venue_address" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Địa điểm tổ chức <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="venue_address"
            placeholder="VD: CLB Bida Sài Gòn, 123 Nguyễn Huệ, Q1, TP.HCM"
            {...register('venue_address')}
            className={`flex-1 ${errors.venue_address ? 'border-destructive' : ''}`}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fillClubAddress}
                  disabled={!clubProfile?.address}
                  className="whitespace-nowrap bg-primary/10 hover:bg-primary/20 border-primary/20 hover:border-primary/30 text-primary hover:text-primary transition-all duration-200"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Địa chỉ CLB
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Điền địa chỉ CLB của bạn</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {errors.venue_address && (
          <p className="text-sm text-destructive">{String(errors.venue_address.message)}</p>
        )}
        {clubProfile?.address && (
          <p className="text-xs text-muted-foreground">
            CLB của bạn: {clubProfile.club_name}, {clubProfile.address}
          </p>
        )}
      </div>

      {/* Optional Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Mô tả giải đấu
          <span className="text-muted-foreground ml-1">(Tùy chọn)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Mô tả ngắn gọn về giải đấu..."
          rows={3}
          {...register('description')}
        />
      </div>
    </div>
  );
};