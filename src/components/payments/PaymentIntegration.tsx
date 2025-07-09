import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Smartphone, Building2, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'card' | 'ewallet' | 'banking' | 'crypto';
  fee: number;
  processingTime: string;
}

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: <CreditCard className="h-5 w-5" />,
    type: 'card',
    fee: 2.5,
    processingTime: 'Tức thì'
  },
  {
    id: 'momo',
    name: 'MoMo',
    icon: <Smartphone className="h-5 w-5" />,
    type: 'ewallet',
    fee: 1.5,
    processingTime: 'Tức thì'
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: <Wallet className="h-5 w-5" />,
    type: 'ewallet',
    fee: 1.5,
    processingTime: 'Tức thì'
  },
  {
    id: 'banking',
    name: 'Chuyển khoản ngân hàng',
    icon: <Building2 className="h-5 w-5" />,
    type: 'banking',
    fee: 0,
    processingTime: '15-30 phút'
  }
];

export function PaymentIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      amount: 500000,
      method: 'VNPay',
      status: 'completed',
      date: '2024-01-15',
      description: 'Nạp tiền vào ví'
    },
    {
      id: '2',
      amount: 100000,
      method: 'MoMo',
      status: 'pending',
      date: '2024-01-14',
      description: 'Thanh toán giải đấu'
    }
  ]);

  const handlePayment = async () => {
    if (!selectedMethod || !amount || !user) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phương thức thanh toán và nhập số tiền",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment transaction record
      const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          transaction_ref: transactionRef,
          amount: parseFloat(amount),
          payment_method: selectedMethod,
          transaction_type: 'deposit',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Call payment processing edge function
      const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke('process-payment', {
        body: {
          transactionId: data.id,
          amount: parseFloat(amount),
          method: selectedMethod,
          returnUrl: window.location.origin + '/payment/callback'
        }
      });

      if (paymentError) throw paymentError;

      // Redirect to payment gateway
      if (paymentResponse.paymentUrl) {
        window.location.href = paymentResponse.paymentUrl;
      } else {
        toast({
          title: "Thành công",
          description: "Giao dịch đã được tạo thành công"
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý thanh toán. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nạp tiền vào ví</CardTitle>
          <CardDescription>
            Chọn phương thức thanh toán và nhập số tiền muốn nạp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (VNĐ)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10000"
              step="1000"
            />
          </div>

          <div className="space-y-3">
            <Label>Phương thức thanh toán</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{method.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>Phí: {method.fee}%</span>
                          <span>•</span>
                          <span>{method.processingTime}</span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {method.type === 'card' && 'Thẻ'}
                        {method.type === 'ewallet' && 'Ví điện tử'}
                        {method.type === 'banking' && 'Ngân hàng'}
                        {method.type === 'crypto' && 'Crypto'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedMethod && amount && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Chi tiết giao dịch</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span>{parseInt(amount).toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao dịch:</span>
                  <span>
                    {(parseInt(amount) * (paymentMethods.find(m => m.id === selectedMethod)?.fee || 0) / 100).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Tổng cộng:</span>
                  <span>
                    {(parseInt(amount) + (parseInt(amount) * (paymentMethods.find(m => m.id === selectedMethod)?.fee || 0) / 100)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || !amount || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
          </Button>
        </CardFooter>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <CardDescription>
            Danh sách các giao dịch gần đây của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{transaction.method}</span>
                      <span>•</span>
                      <span>{transaction.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {transaction.amount.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <Badge variant={
                    transaction.status === 'completed' ? 'default' :
                    transaction.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}