import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefundManagerProps {
  transactionId: string;
  transactionRef: string;
  amount: number;
  status: string;
  onRefundProcessed?: () => void;
}

const RefundManager = ({ 
  transactionId, 
  transactionRef, 
  amount, 
  status,
  onRefundProcessed 
}: RefundManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(amount.toString());
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleRefund = async () => {
    if (!refundAmount || !refundReason.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const refundValue = parseFloat(refundAmount);
    if (refundValue <= 0 || refundValue > amount) {
      toast.error('Số tiền hoàn không hợp lệ');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_refund', {
        p_transaction_id: transactionId,
        p_refund_amount: refundValue,
        p_refund_reason: refundReason.trim(),
      });

      if (error) throw error;

      toast.success('Hoàn tiền thành công');
      setIsOpen(false);
      onRefundProcessed?.();
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Có lỗi khi xử lý hoàn tiền');
    } finally {
      setProcessing(false);
    }
  };

  const canRefund = status === 'success';

  if (!canRefund) {
    return (
      <Badge variant="outline" className="text-xs">
        Không thể hoàn tiền
      </Badge>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Hoàn tiền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Xử lý hoàn tiền
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Thông tin giao dịch</p>
                <p>Mã: {transactionRef}</p>
                <p>Số tiền gốc: {amount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="refund-amount">Số tiền hoàn (VNĐ)</Label>
            <Input
              id="refund-amount"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Nhập số tiền hoàn"
              min="1"
              max={amount}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối đa: {amount.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>

          <div>
            <Label htmlFor="refund-reason">Lý do hoàn tiền</Label>
            <Textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Nhập lý do hoàn tiền..."
              rows={3}
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Cảnh báo</p>
                <p>Thao tác hoàn tiền không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRefund}
              disabled={processing || !refundAmount || !refundReason.trim()}
              className="flex-1"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận hoàn tiền'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundManager;