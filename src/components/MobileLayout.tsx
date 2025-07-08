import { ReactNode } from 'react';
import RealtimeNotificationSystem from './RealtimeNotificationSystem';
import MobileNavigation from './MobileNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
}

const MobileLayout = ({
  children,
  className = '',
  showNavigation = true,
}: MobileLayoutProps) => {
  return (
    <>
      <RealtimeNotificationSystem />
      <div className={`min-h-screen bg-background ${className}`}>
        <div className='mx-auto max-w-md bg-white shadow-lg min-h-screen relative'>
          {/* Main content with bottom padding for navigation */}
          <div className={`${showNavigation ? 'pb-20' : ''}`}>{children}</div>

          {/* Bottom Navigation */}
          {showNavigation && <MobileNavigation />}
        </div>
      </div>
    </>
  );
};

export default MobileLayout;
