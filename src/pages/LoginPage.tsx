
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { phone });
    
    if (!phone || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Validate phone format
    if (!/^0\d{9}$/.test(phone)) {
      toast.error('Số điện thoại phải có định dạng 0xxxxxxxxx');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(phone, password);
      
      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Số điện thoại hoặc mật khẩu không đúng');
        } else if (error.message.includes('Phone not confirmed')) {
          toast.error('Vui lòng xác nhận số điện thoại trước khi đăng nhập');
        } else {
          toast.error(error.message || 'Đăng nhập thất bại');
        }
      } else {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Đăng nhập - CLB Bi-a Sài Gòn</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎱 Đăng nhập</h1>
            <p className="text-gray-600">SABO Pool Arena</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Số điện thoại
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
                className="w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                required
                disabled={loading}
                maxLength={10}
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Mật khẩu
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full h-12 text-lg border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <div className="text-center mt-6 space-y-4">
            <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Quên mật khẩu?
            </Link>
            
            <div className="text-gray-600 text-sm">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Đăng ký ngay
              </Link>
            </div>

            <Link 
              to="/" 
              className="inline-block text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
