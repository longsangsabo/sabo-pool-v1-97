
import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import EnhancedTournamentManager from '@/components/admin/EnhancedTournamentManager';

const AdminTournaments = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>{t('common.access_denied')}</h2>
          <p className='text-gray-600'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedTournamentManager />
  );
};

export default AdminTournaments;
