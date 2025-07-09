import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Gamepad2, Building } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  userRole: 'player' | 'club_owner' | 'both';
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  userRole,
}) => {
  const showClubTab = userRole === 'club_owner' || userRole === 'both';

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
      <TabsList className={`grid w-full ${showClubTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <TabsTrigger value='basic' className='flex items-center gap-2'>
          <User className='h-4 w-4' />
          <span className="hidden sm:inline">Thông tin cá nhân</span>
          <span className="sm:hidden">Cá nhân</span>
        </TabsTrigger>
        <TabsTrigger value='performance' className='flex items-center gap-2'>
          <Trophy className='h-4 w-4' />
          <span className="hidden sm:inline">Thành tích & Ranking</span>
          <span className="sm:hidden">Thành tích</span>
        </TabsTrigger>
        <TabsTrigger value='activities' className='flex items-center gap-2'>
          <Gamepad2 className='h-4 w-4' />
          <span className="hidden sm:inline">Thách đấu & Hoạt động</span>
          <span className="sm:hidden">Hoạt động</span>
        </TabsTrigger>
        {showClubTab && (
          <TabsTrigger value='club' className='flex items-center gap-2'>
            <Building className='h-4 w-4' />
            <span className="hidden sm:inline">Quản lý CLB</span>
            <span className="sm:hidden">CLB</span>
          </TabsTrigger>
        )}
      </TabsList>
      {children}
    </Tabs>
  );
};