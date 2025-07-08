import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Trophy,
  Target,
  Users,
  Circle,
  User,
  Settings,
  Wallet,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Crown,
  History,
  Shield,
  Mail,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useAdminCheck();
  const { getUnreadCount } = useNotifications();
  console.log('Navigation: user admin status:', isAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClubOwner, setIsClubOwner] = useState(false);

  // Check if user is a verified club owner
  useEffect(() => {
    if (user) {
      const checkClubOwner = async () => {
        try {
          const { data, error } = await supabase
            .from('club_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('verification_status', 'approved')
            .single();
          
          setIsClubOwner(!!data && !error);
        } catch (error) {
          setIsClubOwner(false);
        }
      };
      checkClubOwner();
    } else {
      setIsClubOwner(false);
    }
  }, [user]);

  const unreadCount = getUnreadCount();

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const navigationItems = [
    { name: 'Trang chủ', href: '/', current: location.pathname === '/' },
    {
      name: 'Giải đấu',
      href: '/tournaments',
      current: location.pathname === '/tournaments',
    },
    {
      name: 'Thách đấu',
      href: '/challenges',
      current: location.pathname === '/challenges',
    },
    {
      name: 'Trận của tôi',
      href: '/my-matches',
      current: location.pathname === '/my-matches',
    },
    {
      name: 'Ranking',
      href: '/leaderboard',
      current: location.pathname === '/leaderboard',
    },
    { name: 'CLB', href: '/clubs', current: location.pathname === '/clubs' },
    {
      name: 'Về chúng tôi',
      href: '/about',
      current: location.pathname === '/about',
    },
    { name: 'Trợ giúp', href: '/help', current: location.pathname === '/help' },
  ];

  const userMenuItems = user
    ? [
        { name: 'Feed', href: '/feed', icon: LayoutDashboard },
        { name: 'Hồ sơ cá nhân', href: '/profile', icon: User },
        { name: 'Quản lý CLB', href: '/club-management', icon: Trophy, requiresClub: true },
        { name: 'Gói hội viên', href: '/membership', icon: Crown },
        { name: 'Ví của tôi', href: '/wallet', icon: Wallet },
        { name: 'Lịch sử trận đấu', href: '/matches', icon: History },
        { name: 'Cài đặt', href: '/settings', icon: Settings },
      ]
    : [];

  return (
    <nav className='bg-white shadow-lg fixed w-full top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link to='/' className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg'>
                <Circle className='w-6 h-6 text-black font-bold' />
              </div>
              <div className='hidden sm:flex flex-col'>
                <span className='text-xl font-black text-gray-900'>SABO</span>
                <span className='text-sm text-yellow-600 font-bold -mt-1'>
                  POOL ARENA
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex lg:items-center lg:space-x-8'>
            {navigationItems.map(item => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-700 hover:text-yellow-600 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Inbox Icon - Only show when logged in */}
            {user && (
              <Link
                to="/inbox"
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/inbox'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-700 hover:text-yellow-600 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                <div className="relative">
                  <Mail className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500 flex items-center justify-center"
                      variant="destructive"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* User Menu & Auth Buttons */}
          <div className='flex items-center space-x-4'>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.user_metadata?.full_name?.charAt(0) ||
                          user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   {userMenuItems.map(item => {
                     const Icon = item.icon;
                     // Skip club management if user is not a club owner
                     if (item.requiresClub && !isClubOwner) return null;
                     
                     return (
                       <DropdownMenuItem key={item.name} asChild>
                         <Link to={item.href} className='flex items-center'>
                           <Icon className='mr-2 h-4 w-4' />
                           <span>{item.name}</span>
                         </Link>
                       </DropdownMenuItem>
                     );
                   })}
                   {isAdmin && (
                     <>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                         <Link to="/admin" className='flex items-center text-purple-600 font-medium'>
                           <Shield className='mr-2 h-4 w-4' />
                           <span>Quản trị Admin</span>
                         </Link>
                       </DropdownMenuItem>
                     </>
                   )}
                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex items-center space-x-4'>
                <Link to='/login'>
                  <Button variant='ghost'>Đăng nhập</Button>
                </Link>
                <Link to='/register'>
                  <Button className='bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold'>
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className='lg:hidden'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className='lg:hidden border-t border-gray-200'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {navigationItems.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    item.current
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Inbox Link */}
              {user && (
                <Link
                  to="/inbox"
                  className={`flex items-center justify-between px-3 py-2 text-base font-medium rounded-md ${
                    location.pathname === '/inbox'
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Hộp thư
                  </div>
                  {unreadCount > 0 && (
                    <Badge 
                      className="h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500 flex items-center justify-center"
                      variant="destructive"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              )}
              
              {!user && (
                <div className='pt-4 border-t border-gray-200'>
                  <Link
                    to='/login'
                    className='block px-3 py-2 text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-gray-50 rounded-md'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to='/register'
                    className='block px-3 py-2 text-base font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-md mt-2'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
