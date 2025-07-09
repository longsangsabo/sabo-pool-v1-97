import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Receipt, 
  Download, 
  RefreshCw, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Transaction {
  id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const PaymentHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Không thể tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      success: "default",
      failed: "destructive", 
      pending: "secondary",
      refunded: "outline"
    };
    
    const labels: { [key: string]: string } = {
      success: "Thành công",
      failed: "Thất bại",
      pending: "Đang xử lý",
      refunded: "Đã hoàn tiền"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      membership: "Nâng cấp thành viên",
      wallet_deposit: "Nạp ví",
      tournament_fee: "Phí giải đấu",
      club_payment: "Thanh toán CLB"
    };
    return labels[type] || type;
  };

  const downloadReceipt = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { transactionId }
      });

      if (error) throw error;

      if (data?.receiptUrl) {
        window.open(data.receiptUrl, '_blank');
      } else {
        toast.error('Không thể tạo hóa đơn');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Có lỗi khi tải hóa đơn');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Lịch sử thanh toán
          </CardTitle>
          <div className="flex gap-2">
            <select
              className="px-3 py-1 border rounded-md text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="pending">Đang xử lý</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có giao dịch nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {transaction.transaction_ref}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeLabel(transaction.transaction_type)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {transaction.amount.toLocaleString('vi-VN')} {transaction.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </TableCell>
                  <TableCell>
                    {transaction.status === 'success' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(transaction.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Hóa đơn
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;