import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Swords, 
  Trophy, 
  Users, 
  User,
  Bell,
  Wallet,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const MobileNavigation = () => {
  const location = useLocation();

  // Get notification count
  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .is('deleted_at', null);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000
  });

  // Get pending challenges count
  const { data: challengeCount } = useQuery({
    queryKey: ['pending-challenges-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000
  });

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Trang chủ',
      icon: Home
    },
    {
      path: '/challenges',
      label: 'Thách đấu',
      icon: Swords,
      badge: challengeCount
    },
    {
      path: '/tournaments',
      label: 'Giải đấu',
      icon: Trophy
    },
    {
      path: '/calendar',
      label: 'Lịch',
      icon: Calendar
    },
    {
      path: '/notifications',
      label: 'Thông báo',
      icon: Bell,
      badge: notificationCount
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${
                active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
                {item.badge && Number(item.badge) > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center"
                  >
                    {Number(item.badge) > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium truncate w-full text-center ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};