import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy } from 'lucide-react';
import ClubMemberManagement from '@/components/ClubMemberManagement';
import SimpleRankVerification from '@/components/SimpleRankVerification';

const ClubMembersTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Xác thực & Thành viên</h2>
        <p className="text-muted-foreground">
          Quản lý thành viên và xử lý các yêu cầu xác thực hạng
        </p>
      </div>
      
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Quản lý thành viên
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Xác thực hạng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <ClubMemberManagement />
        </TabsContent>

        <TabsContent value="verification">
          <SimpleRankVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubMembersTab;