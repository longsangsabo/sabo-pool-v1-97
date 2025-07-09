
import React from 'react';
import { Save, Shield, Bell, Globe, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/AdminLayout';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const AdminSettings = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  if (adminLoading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Access Denied</h2>
            <p className='text-gray-600'>You don't have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Cài Đặt Hệ Thống</h1>
            <p className='text-gray-600'>Quản lý cấu hình và thiết lập hệ thống</p>
          </div>
          <Button className='gap-2'>
            <Save className='w-4 h-4' />
            Lưu thay đổi
          </Button>
        </div>

        <div className='grid gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='w-5 h-5' />
                Cài đặt chung
              </CardTitle>
              <CardDescription>Cấu hình cơ bản của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='siteName'>Tên website</Label>
                  <Input id='siteName' defaultValue='SABO Pool Arena Hub' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='siteUrl'>URL chính</Label>
                  <Input id='siteUrl' defaultValue='https://sabopool.com' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='siteDescription'>Mô tả website</Label>
                <Textarea 
                  id='siteDescription' 
                  defaultValue='Nền tảng quản lý giải đấu bida chuyên nghiệp tại Việt Nam'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='language'>Ngôn ngữ mặc định</Label>
                <Select defaultValue='vi'>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='vi'>Tiếng Việt</SelectItem>
                    <SelectItem value='en'>English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Bảo mật
              </CardTitle>
              <CardDescription>Cài đặt bảo mật và quyền truy cập</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='twoFactor'>Xác thực 2 bước bắt buộc</Label>
                  <p className='text-sm text-gray-500'>Yêu cầu tất cả admin bật 2FA</p>
                </div>
                <Switch id='twoFactor' />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='sessionTimeout'>Tự động đăng xuất</Label>
                  <p className='text-sm text-gray-500'>Đăng xuất sau 30 phút không hoạt động</p>
                </div>
                <Switch id='sessionTimeout' defaultChecked />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='maxLoginAttempts'>Số lần đăng nhập tối đa</Label>
                <Input id='maxLoginAttempts' type='number' defaultValue='5' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='w-5 h-5' />
                Thông báo
              </CardTitle>
              <CardDescription>Cấu hình hệ thống thông báo</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='emailNotifications'>Thông báo email</Label>
                  <p className='text-sm text-gray-500'>Gửi email cho các sự kiện quan trọng</p>
                </div>
                <Switch id='emailNotifications' defaultChecked />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='pushNotifications'>Thông báo đẩy</Label>
                  <p className='text-sm text-gray-500'>Gửi thông báo đẩy qua trình duyệt</p>
                </div>
                <Switch id='pushNotifications' defaultChecked />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='adminEmail'>Email admin</Label>
                <Input id='adminEmail' type='email' defaultValue='admin@sabopool.com' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='w-5 h-5' />
                Hệ thống
              </CardTitle>
              <CardDescription>Cấu hình kỹ thuật và hiệu suất</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='maintenanceMode'>Chế độ bảo trì</Label>
                  <p className='text-sm text-gray-500'>Tạm ngừng truy cập của người dùng</p>
                </div>
                <Switch id='maintenanceMode' />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='debugMode'>Chế độ debug</Label>
                  <p className='text-sm text-gray-500'>Hiển thị thông tin debug chi tiết</p>
                </div>
                <Switch id='debugMode' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='cacheTimeout'>Thời gian cache (phút)</Label>
                  <Input id='cacheTimeout' type='number' defaultValue='60' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='maxFileSize'>Kích thước file tối đa (MB)</Label>
                  <Input id='maxFileSize' type='number' defaultValue='10' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
