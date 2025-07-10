import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import MobileNavigation from './MobileNavigation';
import { FloatingUserChat } from './FloatingUserChat';
import { useAuth } from '@/hooks/useAuth';

const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Hide navigation on specific pages
  const hideNavPages = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];
  const shouldHideNav = hideNavPages.includes(location.pathname);
  
  // Check if current page is simple club pages
  const isSimpleClubPage = location.pathname.startsWith('/simple-');
  
  if (shouldHideNav || isSimpleClubPage) {
    return <Outlet />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16 pb-20 lg:pb-4">
        <Outlet />
      </main>
      {user && <MobileNavigation />}
      <FloatingUserChat />
    </div>
  );
};

export default MainLayout;