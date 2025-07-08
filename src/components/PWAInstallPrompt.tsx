import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Star } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already running as PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);

    // Check if user already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (!isStandaloneMode && !dismissed) {
      if (isIOSDevice) {
        // Show iOS instructions after a delay
        setTimeout(() => setShowPrompt(true), 5000);
      } else {
        // Handle Android/Chrome install prompt
        const handler = (e: BeforeInstallPromptEvent) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS instructions
      toast.info('Để cài đặt: Nhấn nút Chia sẻ → Thêm vào Màn hình Chính', {
        duration: 5000
      });
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Cài đặt ứng dụng thành công!');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install failed:', error);
      toast.error('Cài đặt thất bại');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className='fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm'>
      <Card className='shadow-xl bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm border-primary/20 animate-slide-up'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-sm">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-sm mb-1 flex items-center gap-1'>
                Cài đặt SABO POOL
                <Star className="h-3 w-3 text-amber-500" />
              </h3>
              <p className='text-xs text-muted-foreground mb-3'>
                {isIOS 
                  ? 'Thêm vào màn hình chính để truy cập nhanh'
                  : 'Trải nghiệm tốt hơn với ứng dụng native'
                }
              </p>
              
              {/* Benefits */}
              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>✓ Tải nhanh</span>
                <span>✓ Thông báo</span>
                <span>✓ Offline</span>
              </div>
              
              <div className='flex gap-2'>
                <Button 
                  size='sm' 
                  onClick={handleInstall} 
                  className='flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80'
                >
                  <Download className='h-4 w-4 mr-1' />
                  {isIOS ? 'Hướng dẫn' : 'Cài đặt'}
                </Button>
                <Button 
                  size='sm' 
                  variant='outline' 
                  onClick={handleDismiss}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
