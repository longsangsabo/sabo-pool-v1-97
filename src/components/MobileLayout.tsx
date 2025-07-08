import { ReactNode } from 'react';
import RealtimeNotificationSystem from './RealtimeNotificationSystem';
import MobileNavigation from './MobileNavigation';
import PWAInstallPrompt from './PWAInstallPrompt';

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
      <PWAInstallPrompt />
      <div className={`min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/20 ${className}`}>
        <div className='mx-auto max-w-md bg-card/90 backdrop-blur-sm shadow-2xl min-h-screen relative border-x border-border/50'>
          {/* Status bar spacer for mobile */}
          <div className="h-safe-top bg-primary/5"></div>
          
          {/* Main content with improved padding */}
          <div className={`${showNavigation ? 'pb-24' : 'pb-4'} pt-2 px-1`}>
            <div className="animate-fade-in">
              {children}
            </div>
          </div>

          {/* Bottom Navigation with enhanced design */}
          {showNavigation && (
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
              <div className="bg-card/95 backdrop-blur-md border-t border-border/50 pb-safe-bottom">
                <MobileNavigation />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileLayout;
