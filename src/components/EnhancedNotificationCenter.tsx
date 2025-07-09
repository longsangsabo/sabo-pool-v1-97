import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';
import EnhancedNotificationCard from './EnhancedNotificationCard';
import { Challenge, ChallengeProposal } from '@/types/common';

const EnhancedNotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
  } = useEnhancedNotifications();

  const { respondToChallenge } = useEnhancedChallenges();
  const [isOpen, setIsOpen] = useState(false);

  const handleChallengeResponse = async (
    challengeId: string,
    status: 'accepted' | 'declined',
    proposalData?: ChallengeProposal
  ) => {
    try {
      await respondToChallenge.mutateAsync({
        challengeId,
        status,
        message: proposalData?.message || 'Response via notification',
      });
    } catch (error) {
      console.error('Error responding to challenge:', error);
    }
  };

  // Use mock notifications since notifications table doesn't exist
  const formattedNotifications = [
    {
      id: '1',
      title: 'Thách đấu mới',
      message: 'Bạn có một thách đấu mới từ Nguyễn Văn A',
      type: 'challenge',
      priority: 'high' as const,
      read_at: undefined,
      created_at: new Date().toISOString(),
      challenge: {
        id: '1',
        bet_points: 300,
        message: 'Thách đấu race to 8',
        status: 'pending',
        challenger: {
          user_id: '1',
          full_name: 'Nguyễn Văn A',
          avatar_url: undefined,
          current_rank: 'A1',
        },
      },
    },
    {
      id: '2',
      title: 'Giải đấu mới',
      message: 'Giải đấu tháng 7 đã mở đăng ký',
      type: 'tournament',
      priority: 'normal' as const,
      read_at: undefined,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      challenge: null,
    },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='border-b'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <CardTitle className='text-lg'>Thông báo</CardTitle>
                {isConnected ? (
                  <div className='flex items-center'>
                    <Wifi className='h-4 w-4 text-green-500' />
                    <span className='sr-only'>Kết nối real-time</span>
                  </div>
                ) : (
                  <div className='flex items-center'>
                    <WifiOff className='h-4 w-4 text-red-500' />
                    <span className='sr-only'>Mất kết nối real-time</span>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {unreadCount > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className='text-xs'
                  >
                    <CheckCheck className='h-3 w-3 mr-1' />
                    Đọc tất cả
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsOpen(false)}
                  className='h-6 w-6'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className='text-sm text-gray-600'>
                {unreadCount} thông báo chưa đọc
              </div>
            )}
          </CardHeader>
          <CardContent className='p-0'>
            <ScrollArea className='h-96'>
              {isLoading ? (
                <div className='p-6 text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
                  <p className='text-gray-500'>Đang tải thông báo...</p>
                </div>
              ) : formattedNotifications.length === 0 ? (
                <div className='p-6 text-center text-gray-500'>
                  <Bell className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                <div className='divide-y space-y-0'>
                  {formattedNotifications.map(notification => (
                    <div key={notification.id} className='p-3'>
                      <EnhancedNotificationCard
                        notification={notification}
                        onMarkAsRead={id => markAsRead.mutate(id)}
                        onRespond={handleChallengeResponse}
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedNotificationCenter;
