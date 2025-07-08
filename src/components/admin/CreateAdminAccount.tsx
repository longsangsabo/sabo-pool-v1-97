import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminAccountForm {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

const CreateAdminAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminAccountForm>({
    email: 'admin@sabo.com',
    password: 'Acookingoil123@',
    full_name: 'System Administrator',
    phone: '0961167717'
  });

  const handleInputChange = (field: keyof AdminAccountForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };

  const createAdminAccount = async () => {
    if (!formData.email || !formData.password) {
      setError('Email và password không được để trống');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating admin account:', { 
        email: formData.email, 
        full_name: formData.full_name 
      });

      const { data, error: functionError } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          create_admin: true
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Failed to create admin account');
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      if (data?.success) {
        console.log('Admin account created successfully:', data);
        setSuccess(true);
        toast.success('🎉 Tài khoản admin đã được tạo thành công!');
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          full_name: '',
          phone: ''
        });
      } else {
        throw new Error('Unknown error occurred');
      }

    } catch (err: any) {
      console.error('Error creating admin account:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo tài khoản admin');
      toast.error('❌ Không thể tạo tài khoản admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminAccount();
  };

  if (success) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Tài khoản Admin đã được tạo thành công!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Password:</strong> {formData.password}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Bạn có thể đăng nhập với thông tin trên. Tài khoản đã được cấp quyền admin đầy đủ.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => {
              setSuccess(false);
              setFormData({
                email: 'admin@sabo.com',
                password: 'Acookingoil123@',
                full_name: 'System Administrator',
                phone: '0961167717'
              });
            }}
            variant="outline"
            className="mt-4"
          >
            Tạo tài khoản admin khác
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Tạo tài khoản Admin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="admin@sabo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Nhập password mạnh"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                placeholder="System Administrator"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                placeholder="0961167717"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo tài khoản admin...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Tạo tài khoản Admin
              </>
            )}
          </Button>
        </form>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Lưu ý:</strong> Tài khoản admin sẽ có quyền truy cập đầy đủ vào hệ thống. 
            Hãy đảm bảo thông tin đăng nhập được bảo mật.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CreateAdminAccount;