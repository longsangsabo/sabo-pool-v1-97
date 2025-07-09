import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Settings } from 'lucide-react';
import ClubProfileForm from '@/components/ClubProfileForm';
import ClubSettings from '@/components/ClubSettings';

const ClubSettingsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Cài đặt & Hồ sơ</h2>
        <p className="text-muted-foreground">
          Quản lý thông tin câu lạc bộ và cấu hình hệ thống
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Thông tin CLB
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Cài đặt nâng cao
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ClubProfileForm />
        </TabsContent>

        <TabsContent value="settings">
          <ClubSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubSettingsTab;