import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Receipt,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  canRetry: boolean;
}

interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_ref: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface PaymentFlowProps {
  amount: number;
  purpose: string;
  onSuccess?: (transaction: PaymentTransaction) => void;
  onFailure?: (error: string) => void;
}

const PaymentProcessingFlow: React.FC<PaymentFlowProps> = ({ 
  amount, 
  purpose, 
  onSuccess, 
  onFailure 
}) => {
  const { user } = useAuth();
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('vnpay');
  const [processing, setProcessing] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  useEffect(() => {
    initializePaymentSteps();
  }, []);

  const initializePaymentSteps = () => {
    const steps: PaymentStep[] = [
      {
        id: 'validation',
        name: 'Xác thực thông tin',
        status: 'pending',
        description: 'Kiểm tra thông tin người dùng và số tiền',
        canRetry: true
      },
      {
        id: 'creation',
        name: 'Tạo giao dịch',
        status: 'pending',
        description: 'Tạo bản ghi giao dịch trong hệ thống',
        canRetry: true
      },
      {
        id: 'gateway',
        name: 'Kết nối cổng thanh toán',
        status: 'pending',
        description: 'Chuyển hướng đến cổng thanh toán',
        canRetry: true
      },
      {
        id: 'processing',
        name: 'Xử lý thanh toán',
        status: 'pending',
        description: 'Người dùng thực hiện thanh toán',
        canRetry: false
      },
      {
        id: 'verification',
        name: 'Xác minh kết quả',
        status: 'pending',
        description: 'Xác minh kết quả từ cổng thanh toán',
        canRetry: true
      },
      {
        id: 'completion',
        name: 'Hoàn tất',
        status: 'pending',
        description: 'Cập nhật trạng thái và thông báo',
        canRetry: false
      }
    ];

    setPaymentSteps(steps);
  };

  const updateStepStatus = (stepIndex: number, status: PaymentStep['status']) => {
    setPaymentSteps(prev => 
      prev.map((step, index) => 
        index === stepIndex ? { ...step, status } : step
      )
    );
  };

  const processPayment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thực hiện thanh toán');
      return;
    }

    setProcessing(true);
    setCurrentStep(0);

    try {
      // Step 1: Validation
      updateStepStatus(0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      if (amount <= 0) {
        throw new Error('Số tiền không hợp lệ');
      }
      
      updateStepStatus(0, 'completed');
      setCurrentStep(1);

      // Step 2: Create Transaction
      updateStepStatus(1, 'processing');
      
      const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: newTransaction, error: createError } = await supabase.rpc(
        'create_payment_transaction',
        {
          p_user_id: user.id,
          p_amount: amount,
          p_transaction_ref: transactionRef,
          p_transaction_type: purpose,
          p_payment_method: paymentMethod
        }
      );

      if (createError) throw createError;

      const { data: transactionData, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_ref', transactionRef)
        .single();

      if (fetchError) throw fetchError;

      setTransaction(transactionData);
      updateStepStatus(1, 'completed');
      setCurrentStep(2);

      // Step 3: Gateway Connection
      updateStepStatus(2, 'processing');
      
      // Simulate gateway integration
      const gatewayUrl = await connectToPaymentGateway(transactionData, paymentMethod);
      setPaymentUrl(gatewayUrl);
      
      updateStepStatus(2, 'completed');
      setCurrentStep(3);
      
      // Step 4: Processing (User action required)
      updateStepStatus(3, 'processing');
      
      // Open payment gateway in new window
      if (gatewayUrl) {
        window.open(gatewayUrl, '_blank', 'width=800,height=600');
      }

      // Start polling for payment status
      startPaymentStatusPolling(transactionData.id);

    } catch (error: any) {
      console.error('Payment processing error:', error);
      updateStepStatus(currentStep, 'failed');
      toast.error(error.message || 'Lỗi khi xử lý thanh toán');
      onFailure?.(error.message);
    }
  };

  const connectToPaymentGateway = async (transaction: PaymentTransaction, method: string): Promise<string> => {
    // Simulate different payment gateways
    switch (method) {
      case 'vnpay':
        return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${transaction.transaction_ref}&vnp_Amount=${transaction.amount * 100}&vnp_OrderInfo=${encodeURIComponent(purpose)}`;
      
      case 'momo':
        return `https://test-payment.momo.vn/pay?orderId=${transaction.transaction_ref}&amount=${transaction.amount}&orderInfo=${encodeURIComponent(purpose)}`;
      
      case 'zalopay':
        return `https://sb-openapi.zalopay.vn/v2/create?app_trans_id=${transaction.transaction_ref}&amount=${transaction.amount}&item=${encodeURIComponent(purpose)}`;
      
      default:
        throw new Error('Phương thức thanh toán không được hỗ trợ');
    }
  };

  const startPaymentStatusPolling = (transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('id', transactionId)
          .single();

        if (error) throw error;

        if (data.status === 'success') {
          clearInterval(pollInterval);
          updateStepStatus(3, 'completed');
          setCurrentStep(4);
          
          // Step 5: Verification
          updateStepStatus(4, 'processing');
          await verifyPayment(data);
          updateStepStatus(4, 'completed');
          setCurrentStep(5);
          
          // Step 6: Completion
          updateStepStatus(5, 'processing');
          await completePayment(data);
          updateStepStatus(5, 'completed');
          
          setProcessing(false);
          onSuccess?.(data);
          toast.success('Thanh toán thành công!');
          
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          updateStepStatus(3, 'failed');
          setProcessing(false);
          onFailure?.('Thanh toán thất bại');
          toast.error('Thanh toán thất bại');
        }

        setTransaction(data);
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (processing) {
        updateStepStatus(3, 'failed');
        setProcessing(false);
        toast.error('Timeout: Vui lòng thử lại');
      }
    }, 10 * 60 * 1000);
  };

  const verifyPayment = async (transaction: PaymentTransaction) => {
    // Simulate payment verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would verify with the payment gateway
    console.log('Verifying payment:', transaction.transaction_ref);
  };

  const completePayment = async (transaction: PaymentTransaction) => {
    // Update wallet balance or perform other completion tasks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update user's wallet if it's a wallet top-up
    if (purpose === 'wallet_topup') {
      await supabase.rpc('update_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: transaction.amount,
        p_transaction_type: 'deposit'
      });
    }
  };

  const retryStep = async (stepIndex: number) => {
    const step = paymentSteps[stepIndex];
    if (!step.canRetry) return;

    updateStepStatus(stepIndex, 'pending');
    setCurrentStep(stepIndex);
    
    // Retry the payment process from this step
    // This is a simplified retry - in reality, each step would have specific retry logic
    toast.info(`Đang thử lại: ${step.name}`);
  };

  const getStepIcon = (status: PaymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: PaymentStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Quy trình thanh toán
          </CardTitle>
          <CardDescription>
            Thanh toán {amount?.toLocaleString('vi-VN')} VNĐ cho {purpose}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flow" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flow">Quy trình</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
            </TabsList>

            <TabsContent value="flow" className="space-y-6">
              {/* Payment Method Selection */}
              {!processing && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Chọn phương thức thanh toán</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`p-4 border rounded-lg flex items-center gap-3 ${
                        paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">VN</span>
                      </div>
                      <span>VNPay</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-4 border rounded-lg flex items-center gap-3 ${
                        paymentMethod === 'momo' ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MM</span>
                      </div>
                      <span>MoMo</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('zalopay')}
                      className={`p-4 border rounded-lg flex items-center gap-3 ${
                        paymentMethod === 'zalopay' ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">ZP</span>
                      </div>
                      <span>ZaloPay</span>
                    </button>
                  </div>

                  <Button
                    onClick={processPayment}
                    disabled={processing}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Bắt đầu thanh toán
                  </Button>
                </div>
              )}

              {/* Payment Steps */}
              {paymentSteps.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Các bước thanh toán</h3>
                  <div className="space-y-3">
                    {paymentSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-4 border rounded-lg ${getStepColor(step.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStepIcon(step.status)}
                            <div>
                              <h4 className="font-medium">{step.name}</h4>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.status === 'failed' && step.canRetry && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryStep(index)}
                              >
                                Thử lại
                              </Button>
                            )}
                            <Badge variant={
                              step.status === 'completed' ? 'default' :
                              step.status === 'processing' ? 'secondary' :
                              step.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {step.status === 'pending' && 'Chờ'}
                              {step.status === 'processing' && 'Đang xử lý'}
                              {step.status === 'completed' && 'Hoàn thành'}
                              {step.status === 'failed' && 'Thất bại'}
                            </Badge>
                          </div>
                        </div>
                        
                        {step.status === 'processing' && index === 3 && paymentUrl && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">
                              Vui lòng hoàn tất thanh toán trong cửa sổ mới đã mở
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(paymentUrl, '_blank')}
                            >
                              Mở lại cổng thanh toán
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ thanh toán</span>
                    <span>{Math.round((currentStep / paymentSteps.length) * 100)}%</span>
                  </div>
                  <Progress value={(currentStep / paymentSteps.length) * 100} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Transaction Details */}
              {transaction && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Chi tiết giao dịch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mã giao dịch:</span>
                        <span className="font-mono text-sm">{transaction.transaction_ref}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số tiền:</span>
                        <span className="font-semibold">{transaction.amount?.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phương thức:</span>
                        <span>{transaction.payment_method?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <Badge variant={
                          transaction.status === 'success' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tạo lúc:</span>
                        <span>{new Date(transaction.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cập nhật:</span>
                        <span>{new Date(transaction.updated_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Bảo mật thanh toán</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tất cả giao dịch được mã hóa SSL</li>
                  <li>• Thông tin thẻ không được lưu trữ trên hệ thống</li>
                  <li>• Tuân thủ tiêu chuẩn bảo mật PCI DSS</li>
                  <li>• Hỗ trợ xác thực 3D Secure</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentProcessingFlow;