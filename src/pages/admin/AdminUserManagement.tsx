import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';

// Import the existing components
import AdminUsers from './AdminUsers';
import AdminClubRegistrations from './AdminClubRegistrations';
import AdminApprovedClubs from './AdminApprovedClubs';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const AdminUserManagement = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('users');

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-foreground mb-4'>{t('common.access_denied')}</h2>
          <p className='text-muted-foreground'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng & CLB</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="club-registrations" className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4" />
            Đăng ký CLB
          </TabsTrigger>
          <TabsTrigger value="approved-clubs" className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            CLB đã duyệt
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <AdminUsers skipAdminCheck={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="club-registrations" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <AdminClubRegistrations />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved-clubs" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <AdminApprovedClubs />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement;