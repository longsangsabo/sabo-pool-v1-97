import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, History, RefreshCw, Shield } from 'lucide-react';
import PaymentHistory from '@/components/payment/PaymentHistory';
import DepositModal from '@/components/DepositModal';
import { PaymentButton } from '@/components/PaymentButton';
import MobileLayout from '@/components/MobileLayout';

const PaymentPage = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  return (
    <MobileLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Thanh toán & Ví</h1>
        </div>

        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment">Thanh toán</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
            <TabsTrigger value="security">Bảo mật</TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Membership Upgrade */}
              <Card>
                <CardHeader>
                  <CardTitle>Nâng cấp thành viên</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Gói Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Truy cập đầy đủ tính năng cao cấp
                    </p>
                    <p className="text-2xl font-bold text-primary">99,000 VNĐ</p>
                  </div>
                  <PaymentButton 
                    membershipType="premium"
                    amount={99000}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gói VIP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Gói VIP</h3>
                    <p className="text-sm text-muted-foreground">
                      Tất cả tính năng Premium + quyền lợi VIP
                    </p>
                    <p className="text-2xl font-bold text-primary">199,000 VNĐ</p>
                  </div>
                  <PaymentButton 
                    membershipType="vip"
                    amount={199000}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Wallet Deposit */}
            <Card>
              <CardHeader>
                <CardTitle>Nạp tiền vào ví</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Nạp tiền vào ví để thanh toán các dịch vụ trong hệ thống
                </p>
                <button
                  onClick={() => setDepositModalOpen(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Nạp tiền vào ví
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Bảo mật thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">Rate Limiting</h4>
                      <p className="text-sm text-muted-foreground">
                        Giới hạn số lần thử thanh toán
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Đã bật</div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">Input Validation</h4>
                      <p className="text-sm text-muted-foreground">
                        Kiểm tra dữ liệu đầu vào
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Đã bật</div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">Secure Hash</h4>
                      <p className="text-sm text-muted-foreground">
                        Mã hóa thông tin thanh toán
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Đã bật</div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">Transaction Logging</h4>
                      <p className="text-sm text-muted-foreground">
                        Ghi log tất cả giao dịch
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Đã bật</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DepositModal
          isOpen={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          onSuccess={() => {
            setDepositModalOpen(false);
            // Refresh page or update data
          }}
        />
      </div>
    </MobileLayout>
  );
};

export default PaymentPage;