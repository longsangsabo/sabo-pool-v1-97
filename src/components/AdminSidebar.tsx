
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const AdminSidebar = () => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { icon: LayoutDashboard, key: 'admin.dashboard', path: '/admin' },
    { icon: Users, key: 'admin.users', path: '/admin/users' },
    { icon: Trophy, key: 'admin.tournaments', path: '/admin/tournaments' },
    { icon: Building2, key: 'admin.clubs', path: '/admin/clubs' },
    { icon: CreditCard, key: 'admin.transactions', path: '/admin/transactions' },
    { icon: BarChart3, key: 'admin.analytics', path: '/admin/analytics' },
    { icon: Bot, key: 'admin.automation', path: '/admin/automation' },
    { icon: TestTube, key: 'admin.test_ranking', path: '/admin/test-ranking' },
    { icon: Code, key: 'admin.development', path: '/admin/development' },
    { icon: Settings, key: 'admin.settings', path: '/admin/settings' },
  ];

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className='w-64 bg-white border-r min-h-screen flex flex-col'>
      <div className='p-6 border-b'>
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
            >
              <Icon className='h-5 w-5' />
              <span>{t(item.key)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className='p-4 border-t space-y-2'>
        <NavLink to="/" className="block">
          <Button
            variant='ghost'
            className='w-full justify-start gap-3 text-gray-600 hover:bg-gray-100'
          >
            <Home className='h-5 w-5' />
            {t('admin.home')}
          </Button>
        </NavLink>
        <Button
          variant='ghost'
          className='w-full justify-start gap-3 text-gray-600'
          onClick={signOut}
        >
          <LogOut className='h-5 w-5' />
          {t('admin.logout')}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
