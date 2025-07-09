import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, MapPin, Save, RotateCcw } from 'lucide-react';
import { WalletBalance } from '@/components/WalletBalance';

interface ProfileData {
  display_name: string;
  phone: string;
  bio: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  city: string;
  district: string;
}

interface BasicProfileTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  hasChanges: boolean;
  updating: boolean;
  onUpdateAll: () => void;
  onReset: () => void;
  onFieldBlur: (field: string, value: string) => void;
  skillLevels: Record<string, { label: string; color: string }>;
}

const BasicProfileTab: React.FC<BasicProfileTabProps> = ({
  profile,
  setProfile,
  hasChanges,
  updating,
  onUpdateAll,
  onReset,
  onFieldBlur,
  skillLevels,
}) => {
  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <WalletBalance />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tên hiển thị *
            </label>
            <Input
              value={profile.display_name}
              onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
              onBlur={(e) => onFieldBlur('display_name', e.target.value)}
              placeholder="Nhập tên hiển thị của bạn"
              className="h-12 text-lg"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Số điện thoại
            </label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              onBlur={(e) => onFieldBlur('phone', e.target.value)}
              placeholder="0987654321"
              className="h-12 text-lg"
              type="tel"
              inputMode="numeric"
            />
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trình độ chơi bida
            </label>
            <Select
              value={profile.skill_level}
              onValueChange={(value) => {
                setProfile(prev => ({ ...prev, skill_level: value as any }));
                onFieldBlur('skill_level', value);
              }}
            >
              <SelectTrigger className="h-12 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(skillLevels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Thành phố
              </label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                onBlur={(e) => onFieldBlur('city', e.target.value)}
                placeholder="TP. Hồ Chí Minh"
                className="h-12 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quận/Huyện
              </label>
              <Input
                value={profile.district}
                onChange={(e) => setProfile(prev => ({ ...prev, district: e.target.value }))}
                onBlur={(e) => onFieldBlur('district', e.target.value)}
                placeholder="Quận 1"
                className="h-12 text-lg"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Giới thiệu bản thân
              <span className="text-sm text-muted-foreground ml-2">
                ({profile.bio.length}/200)
              </span>
            </label>
            <Textarea
              value={profile.bio}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setProfile(prev => ({ ...prev, bio: e.target.value }));
                }
              }}
              onBlur={(e) => onFieldBlur('bio', e.target.value)}
              placeholder="Chia sẻ về sở thích chơi bida, thành tích hoặc mục tiêu của bạn..."
              className="min-h-[100px] text-lg"
              maxLength={200}
            />
          </div>

          {/* Privacy Notice */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Quyền riêng tư:</strong> Số điện thoại của bạn sẽ không hiển thị công khai. 
              Chỉ tên hiển thị, ảnh đại diện, trình độ và giới thiệu sẽ được hiển thị cho người khác.
            </p>
          </div>

          {/* Update Actions */}
          {hasChanges && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={onUpdateAll}
                disabled={updating || !hasChanges}
                className="flex-1 h-12 text-lg"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Cập nhật thông tin
                  </>
                )}
              </Button>
              <Button 
                onClick={onReset}
                disabled={updating}
                variant="outline"
                className="flex-1 h-12 text-lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Hủy thay đổi
              </Button>
            </div>
          )}

          {!hasChanges && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Thông tin sẽ được tự động lưu khi bạn nhấn ra ngoài ô nhập liệu, hoặc bạn có thể chỉnh sửa và nhấn "Cập nhật thông tin" để lưu tất cả cùng lúc.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicProfileTab;