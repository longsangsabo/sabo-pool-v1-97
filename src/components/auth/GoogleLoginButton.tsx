import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const GoogleLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Initiating Google login...');
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google login error details:', {
          message: error.message,
          code: error.code || 'No code',
          status: error.status || 'No status'
        });
        
        if (error.message.includes('provider is not enabled')) {
          toast.error('❌ Google OAuth chưa được kích hoạt trong Supabase Dashboard. Vui lòng kích hoạt tại Authentication > Providers.');
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('OAuth')) {
          toast.error('❌ Google OAuth chưa được cấu hình đúng. Cần tạo Google Cloud App và thêm Client ID/Secret vào Supabase.');
        } else {
          toast.error(`❌ Lỗi Google Login: ${error.message}`);
        }
      } else {
        console.log('Google login initiated successfully');
      }
    } catch (error) {
      console.error('Google login catch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
      toast.error(`❌ Không thể đăng nhập với Google: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full hover:bg-red-50 border-gray-300 transition-all duration-200 group"
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {loading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
    </Button>
  );
};