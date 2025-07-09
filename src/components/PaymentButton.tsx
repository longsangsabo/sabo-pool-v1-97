
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface PaymentButtonProps {
  membershipType: 'premium' | 'vip';
  className?: string;
  amount?: number;
}

export const PaymentButton = ({
  membershipType,
  className,
  amount = 99000,
}: PaymentButtonProps) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          userId: user.id,
          membershipType,
          amount,
          type: 'membership',
          description: `Nâng cấp ${membershipType} - ${amount.toLocaleString('vi-VN')} VNĐ`,
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error('Không thể tạo link thanh toán');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <LoadingSpinner size='sm' />
          <span className='ml-2'>Đang xử lý...</span>
        </>
      ) : (
        <>
          <Crown className='h-4 w-4 mr-2' />
          Nâng cấp Premium - {amount.toLocaleString('vi-VN')}đ
        </>
      )}
    </Button>
  );
};
