import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Phone, Calendar, Clock, Wand2 } from 'lucide-react';

interface AutoFillButtonProps {
  onAutoFill: (data: AutoFillData) => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

interface AutoFillData {
  venue_address?: string;
  contact_info?: string;
  rules?: string;
  scheduled_start?: string;
  scheduled_end?: string;
}

export const AutoFillButton: React.FC<AutoFillButtonProps> = ({
  onAutoFill,
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAutoFill = async () => {
    setIsLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để sử dụng tính năng này",
          variant: "destructive"
        });
        return;
      }

      // Get user's club profile
      const { data: clubProfile, error: clubError } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (clubError && clubError.code !== 'PGRST116') {
        console.error('Error fetching club profile:', clubError);
      }

      // Get user's basic profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      // Prepare auto-fill data
      const autoFillData: AutoFillData = {};

      // Fill venue address from club profile
      if (clubProfile?.address) {
        autoFillData.venue_address = `${clubProfile.club_name} - ${clubProfile.address}`;
      }

      // Fill contact info from club or user profile
      if (clubProfile?.phone) {
        autoFillData.contact_info = `${clubProfile.phone} - ${clubProfile.club_name}`;
      } else if (userProfile?.phone) {
        autoFillData.contact_info = userProfile.phone;
      }

      // Add default rules based on club type or general rules
      if (clubProfile) {
        autoFillData.rules = `Quy định giải đấu tại ${clubProfile.club_name}:
• Trang phục: Áo có cổ, quần dài, giày thể thao
• Thời gian: Đúng giờ, muộn quá 15 phút sẽ bị loại
• Thiết bị: Sử dụng thiết bị của CLB hoặc thiết bị cá nhân đã được kiểm tra
• Fair Play: Tôn trọng đối thủ và trọng tài
• Không sử dụng điện thoại trong lúc thi đấu`;
      } else {
        autoFillData.rules = `Quy định chung:
• Tuân thủ luật chơi billiards chuẩn
• Trang phục lịch sự
• Tôn trọng đối thủ và trọng tài
• Đúng giờ thi đấu`;
      }

      // Set default tournament schedule (next weekend)
      const now = new Date();
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + ((6 - now.getDay()) % 7 || 7)); // Next Saturday
      nextSaturday.setHours(9, 0, 0, 0); // 9:00 AM

      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      nextSunday.setHours(18, 0, 0, 0); // 6:00 PM

      autoFillData.scheduled_start = nextSaturday.toISOString();
      autoFillData.scheduled_end = nextSunday.toISOString();

      // Call the auto-fill handler
      onAutoFill(autoFillData);

      toast({
        title: "Tự động điền thành công",
        description: clubProfile 
          ? `Đã điền thông tin từ ${clubProfile.club_name}`
          : "Đã điền thông tin cơ bản",
        duration: 3000
      });

    } catch (error) {
      console.error('Auto-fill error:', error);
      toast({
        title: "Lỗi tự động điền",
        description: "Không thể tự động điền thông tin. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleAutoFill}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
      {isLoading ? 'Đang điền...' : 'Tự động điền từ CLB'}
    </Button>
  );
};

export default AutoFillButton;