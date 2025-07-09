
import React, { useState } from 'react';
import { Search, Download, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const AdminTransactions = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock transactions data
  const transactions = [
    {
      id: 'TXN001',
      user_name: 'Nguyễn Văn A',
      type: 'deposit',
      amount: 500000,
      status: 'completed',
      payment_method: 'vnpay',
      description: 'Nạp tiền vào ví',
      created_at: '2024-01-20T10:30:00Z',
    },
    {
      id: 'TXN002',
      user_name: 'Trần Thị B',
      type: 'tournament_fee',
      amount: 100000,
      status: 'completed',
      payment_method: 'wallet',
      description: 'Phí tham gia giải đấu mùa xuân',
      created_at: '2024-01-20T09:15:00Z',
    },
    {
      id: 'TXN003',
      user_name: 'Lê Văn C',
      type: 'withdraw',
      amount: 200000,
      status: 'pending',
      payment_method: 'bank_transfer',
      description: 'Rút tiền về tài khoản ngân hàng',
      created_at: '2024-01-20T08:45:00Z',
    },
  ];

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h2>
          <p className='text-gray-600'>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-100 text-blue-800';
      case 'withdraw':
        return 'bg-orange-100 text-orange-800';
      case 'tournament_fee':
        return 'bg-purple-100 text-purple-800';
      case 'membership':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Nạp tiền';
      case 'withdraw':
        return 'Rút tiền';
      case 'tournament_fee':
        return 'Phí giải đấu';
      case 'membership':
        return 'Hội viên';
      default:
        return type;
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
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Quản Lý Giao Dịch</h1>
            <p className='text-gray-600'>Theo dõi và quản lý các giao dịch tài chính</p>
          </div>
          <Button className='gap-2'>
            <Download className='w-4 h-4' />
            Xuất báo cáo
          </Button>
        </div>

        <div className='flex gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Tìm kiếm giao dịch...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Loại giao dịch' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='deposit'>Nạp tiền</SelectItem>
              <SelectItem value='withdraw'>Rút tiền</SelectItem>
              <SelectItem value='tournament_fee'>Phí giải đấu</SelectItem>
              <SelectItem value='membership'>Hội viên</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='completed'>Hoàn thành</SelectItem>
              <SelectItem value='pending'>Đang xử lý</SelectItem>
              <SelectItem value='failed'>Thất bại</SelectItem>
              <SelectItem value='cancelled'>Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách giao dịch</CardTitle>
            <CardDescription>Tổng cộng {transactions.length} giao dịch</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã GD</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className='font-medium'>{transaction.id}</TableCell>
                    <TableCell>{transaction.user_name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(transaction.type)}>
                        {getTypeText(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {formatPrice(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {getStatusText(transaction.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-gray-600'>
                      {transaction.payment_method}
                    </TableCell>
                    <TableCell className='text-sm text-gray-600'>
                      {formatDate(transaction.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
};

export default AdminTransactions;
