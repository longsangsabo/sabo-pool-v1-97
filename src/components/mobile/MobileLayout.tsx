import React, { ReactNode } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileNavigation } from './MobileNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showWallet?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  showWallet = true,
  showBottomNav = true,
  onMenuClick
}) => {
  return (
    <div className="min-h-screen bg-background lg:hidden">
      {/* Mobile Header */}
      <MobileHeader
        title={title}
        showSearch={showSearch}
        showProfile={showProfile}
        showNotifications={showNotifications}
        showWallet={showWallet}
        onMenuClick={onMenuClick}
      />

      {/* Main Content */}
      <main className={`${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && <MobileNavigation />}
    </div>
  );
};