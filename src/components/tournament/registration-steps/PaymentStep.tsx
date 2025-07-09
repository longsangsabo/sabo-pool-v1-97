import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  DollarSign,
  Banknote,
  Building2,
  Shield,
  Info,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

import { 
  TournamentRegistrationFormData,
  PAYMENT_METHODS
} from '@/schemas/tournamentRegistrationSchema';

interface PaymentStepProps {
  form: UseFormReturn<TournamentRegistrationFormData>;
  selectedTournament: any;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  form,
  selectedTournament
}) => {
  const { watch, setValue, formState: { errors } } = form;
  const watchedData = watch();
  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'cash' | 'transfer'>(
    (watchedData.payment_method as 'vnpay' | 'cash' | 'transfer') || 'vnpay'
  );

  const entryFee = selectedTournament?.entry_fee || 0;
  const processingFee = selectedMethod === 'vnpay' ? Math.round(entryFee * 0.02) : 0; // 2% for VNPAY
  const totalAmount = entryFee + processingFee;

  const handlePaymentMethodSelect = (method: 'vnpay' | 'cash' | 'transfer') => {
    setSelectedMethod(method);
    setValue('payment_method', method as any);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'vnpay':
        return <CreditCard className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'transfer':
        return <Building2 className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getPaymentInstructions = (method: string) => {
    switch (method) {
      case 'vnpay':
        return {
          title: 'Thanh toán qua VNPAY',
          steps: [
            'Nhấn "Hoàn tất đăng ký" để chuyển đến cổng thanh toán',
            'Chọn ngân hàng và nhập thông tin thẻ',
            'Xác nhận giao dịch qua SMS/OTP',
            'Quay lại để xem kết quả đăng ký'
          ],
          note: 'Giao dịch được bảo mật bởi VNPAY. Phí xử lý 2% sẽ được tính thêm.',
          icon: <Shield className="h-4 w-4 text-green-500" />
        };
      case 'cash':
        return {
          title: 'Thanh toán tiền mặt',
          steps: [
            'Đến địa điểm thi đấu trước giờ thi đấu 30 phút',
            'Tìm bàn đăng ký của ban tổ chức',
            'Xuất trình danh tính và thanh toán phí tham gia',
            'Nhận xác nhận và lịch thi đấu'
          ],
          note: 'Vui lòng mang theo CMND/CCCD và số tiền chính xác.',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
        };
      case 'transfer':
        return {
          title: 'Chuyển khoản ngân hàng',
          steps: [
            'Chuyển khoản đến tài khoản của ban tổ chức',
            'Ghi rõ nội dung: "TEN_CUA_BAN - MA_GIAI_DAU"',
            'Chụp ảnh biên lai giao dịch',
            'Gửi biên lai qua email hoặc tin nhắn'
          ],
          note: 'Thông tin tài khoản sẽ được gửi qua email sau khi đăng ký.',
          icon: <Info className="h-4 w-4 text-blue-500" />
        };
      default:
        return null;
    }
  };

  const instructions = getPaymentInstructions(selectedMethod);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Thanh toán phí tham gia</h3>
        <p className="text-muted-foreground">
          Chọn phương thức thanh toán phù hợp với bạn
        </p>
      </div>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Chi tiết thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTournament && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Giải đấu:</span>
                <span className="font-medium">{selectedTournament.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Hạng giải:</span>
                <Badge variant="secondary">Level {selectedTournament.tier_level || 1}</Badge>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Phí đăng ký:</span>
                <span className="font-medium">{entryFee.toLocaleString('vi-VN')}đ</span>
              </div>
              
              {processingFee > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Phí xử lý ({selectedMethod === 'vnpay' ? '2%' : '0%'}):</span>
                  <span>+{processingFee.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.value;
            
            return (
              <div
                key={method.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handlePaymentMethodSelect(method.value as 'vnpay' | 'cash' | 'transfer')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {getPaymentMethodIcon(method.value)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.label}</span>
                        <span className="text-lg">{method.icon}</span>
                      </div>
                      {method.value === 'vnpay' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Hỗ trợ Visa, Master, ATM nội địa
                        </p>
                      )}
                      {method.value === 'cash' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Thanh toán tại địa điểm thi đấu
                        </p>
                      )}
                      {method.value === 'transfer' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Chuyển khoản qua ngân hàng
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            );
          })}
          
          {errors.payment_method && (
            <p className="text-sm text-destructive">{errors.payment_method.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {instructions.icon}
              {instructions.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Hướng dẫn thanh toán:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {instructions.note}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Bảo mật thanh toán:</strong> Mọi giao dịch được mã hóa và bảo mật. 
          Chúng tôi không lưu trữ thông tin thẻ tín dụng của bạn.
        </AlertDescription>
      </Alert>

      {/* Terms Notice */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Lưu ý:</strong> Phí đăng ký không được hoàn lại sau khi đã thanh toán, 
          trừ trường hợp giải đấu bị hủy bởi ban tổ chức.
        </AlertDescription>
      </Alert>
    </div>
  );
};