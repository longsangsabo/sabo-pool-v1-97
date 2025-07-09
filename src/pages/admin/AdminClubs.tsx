
import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminClubRegistrations from '@/pages/admin/AdminClubRegistrations';
import AdminApprovedClubs from '@/pages/admin/AdminApprovedClubs';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, CheckCircle, Clock } from 'lucide-react';

const AdminClubs = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');

  if (adminLoading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>{t('common.access_denied')}</h2>
            <p className='text-gray-600'>{t('common.no_permission')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">{t('admin.club_management')}</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('admin.pending_registrations')}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t('admin.approved_clubs_tab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <AdminClubRegistrations />
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            <AdminApprovedClubs />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminClubs;
