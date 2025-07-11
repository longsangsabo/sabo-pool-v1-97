
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Home,
  TestTube,
  Bot,
  Code,
  X,
  Gamepad2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ isMobile = false, onClose }: AdminSidebarProps = {}) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { icon: LayoutDashboard, key: 'admin.dashboard', path: '/admin' },
    { icon: Users, key: 'admin.user_management', path: '/admin/users' },
    { icon: Trophy, key: 'admin.tournaments', path: '/admin/tournaments' },
    { icon: CreditCard, key: 'admin.transactions', path: '/admin/transactions' },
    { icon: BarChart3, key: 'admin.analytics', path: '/admin/analytics' },
    { icon: Gamepad2, key: 'admin.game_config', path: '/admin/game-config' },
    { icon: Bot, key: 'admin.ai_assistant', path: '/admin/ai-assistant' },
    { icon: TestTube, key: 'admin.test_ranking', path: '/admin/test-ranking' },
    { icon: Code, key: 'admin.development', path: '/admin/development' },
    { icon: Settings, key: 'admin.settings', path: '/admin/settings' },
  ];

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mobile-button ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
    }`;

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className='w-64 bg-white border-r min-h-screen flex flex-col'>
      <div className='p-6 border-b relative'>
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <h2 className='text-xl font-bold text-gray-900'>{t('admin.panel')}</h2>
        <p className='text-sm text-gray-500'>SABO POOL ARENA</p>
      </div>

      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={getNavLinkClass}
              end={item.path === '/admin'}
              onClick={handleNavClick}
            >
              <Icon className='h-5 w-5' />
              <span>{t(item.key)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className='p-4 border-t space-y-2'>
        <NavLink to="/" className="block" onClick={handleNavClick}>
          <Button
            variant='ghost'
            className='w-full justify-start gap-3 text-gray-600 hover:bg-gray-100 mobile-button'
          >
            <Home className='h-5 w-5' />
            {t('admin.home')}
          </Button>
        </NavLink>
        <Button
          variant='ghost'
          className='w-full justify-start gap-3 text-gray-600 mobile-button'
          onClick={() => {
            signOut();
            handleNavClick();
          }}
        >
          <LogOut className='h-5 w-5' />
          {t('admin.logout')}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
