
import { useEffect, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminSidebar from './AdminSidebar';
import LanguageToggle from './admin/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/login');
      } else if (isAdmin === false) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!user || isAdmin === false) {
    return null;
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-64 h-full bg-white">
            <AdminSidebar isMobile onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
      
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='bg-white border-b px-4 lg:px-8 py-4 flex justify-between items-center'>
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className='text-xl lg:text-2xl font-bold text-gray-900'>{t('admin.panel')}</h1>
          </div>
          <LanguageToggle />
        </header>
        <main className='flex-1 p-4 lg:p-8 overflow-auto'>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
