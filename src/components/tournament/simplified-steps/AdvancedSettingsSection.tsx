import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FileText, Phone, Shield } from 'lucide-react';
import { AutoFillInput } from '@/components/common/AutoFillInput';

interface AdvancedSettingsSectionProps {
  form: UseFormReturn<any>;
}

export const AdvancedSettingsSection: React.FC<AdvancedSettingsSectionProps> = ({ form }) => {
  const { register, setValue, watch, formState: { errors } } = form;
  const watchedData = watch();

  return (
    <div className="space-y-4">
      {/* Registration Period */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Thời gian đăng ký
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registration_start" className="text-sm">
              Mở đăng ký
            </Label>
            <Input
              id="registration_start"
              type="datetime-local"
              {...register('registration_start')}
            />
            <p className="text-xs text-muted-foreground">
              Mặc định: ngay bây giờ
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_end" className="text-sm">
              Đóng đăng ký
            </Label>
            <Input
              id="registration_end"
              type="datetime-local"
              {...register('registration_end')}
            />
            <p className="text-xs text-muted-foreground">
              Mặc định: 2 giờ trước khi thi đấu
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2">
        <Label htmlFor="contact_info" className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Thông tin liên hệ
        </Label>
        <AutoFillInput
          id="contact_info"
          fieldType="club"
          fieldName="phone"
          placeholder="Email hoặc số điện thoại liên hệ"
          {...register('contact_info')}
        />
      </div>

      {/* Rules */}
      <div className="space-y-2">
        <Label htmlFor="rules" className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Luật lệ giải đấu
        </Label>
        <Textarea
          id="rules"
          placeholder="Luật lệ và quy định chi tiết (tùy chọn)..."
          rows={3}
          {...register('rules')}
        />
        <p className="text-xs text-muted-foreground">
          Mặc định: Áp dụng luật chung của giải đấu bida
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Cài đặt quyền riêng tư
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_public"
              checked={watchedData.is_public}
              onCheckedChange={(checked) => setValue('is_public', !!checked)}
            />
            <Label htmlFor="is_public" className="text-sm cursor-pointer">
              Công khai (mọi người có thể xem và đăng ký)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_approval"
              checked={watchedData.requires_approval}
              onCheckedChange={(checked) => setValue('requires_approval', !!checked)}
            />
            <Label htmlFor="requires_approval" className="text-sm cursor-pointer">
              Yêu cầu phê duyệt đăng ký
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};