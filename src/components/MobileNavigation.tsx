import React, { ComponentType } from 'react';
import { Home, Compass, Zap, User, Trophy, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  current: boolean;
}

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Trang chủ',
      href: '/',
      icon: Home,
      current: location.pathname === '/' || location.pathname === '/feed',
    },
    {
      name: 'Khám phá',
      href: '/discovery',
      icon: Compass,
      current: location.pathname === '/discovery' || location.pathname === '/enhanced-discovery',
    },
    {
      name: 'Giải đấu',
      href: '/tournaments',
      icon: Trophy,
      current: location.pathname === '/tournaments' || location.pathname === '/tournament-discovery',
    },
    {
      name: 'Thách đấu',
      href: '/challenges',
      icon: Zap,
      current: location.pathname === '/challenges' || location.pathname === '/enhanced-challenges',
    },
    {
      name: 'Trợ giúp',
      href: '/help',
      icon: HelpCircle,
      current: location.pathname === '/help',
    },
    {
      name: 'Hồ sơ',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile',
    },
  ];

  return (
    <div className='flex justify-around items-center h-16 px-2'>
      {navigationItems.map(item => (
        <button
          key={item.name}
          onClick={() => navigate(item.href)}
          className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 transform ${
            item.current
              ? 'text-primary bg-primary/10 rounded-xl mx-1 scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl mx-1 hover:scale-102'
          } focus:outline-none focus:ring-2 focus:ring-primary/50`}
        >
          {/* Active indicator */}
          {item.current && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-full animate-slide-up" />
          )}
          
          <item.icon
            className={`h-5 w-5 mb-1 transition-transform duration-200 ${
              item.current ? 'scale-110' : 'scale-100'
            }`}
          />
          <span
            className={`text-xs font-medium transition-all duration-200 ${
              item.current ? 'font-semibold' : ''
            }`}
          >
            {item.name}
          </span>
          
          {/* Ripple effect on tap */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute inset-0 rounded-xl opacity-0 bg-primary/20 transition-opacity duration-150 active:opacity-100" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default MobileNavigation;
