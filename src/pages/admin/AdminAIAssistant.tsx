import React from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { AIAdminAssistant } from '@/components/admin/AIAdminAssistant';

const AdminAIAssistant = () => {
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Admin Assistant</h1>
        <p className="text-muted-foreground">
          Trợ lý AI thông minh hỗ trợ quản lý và phân tích dữ liệu hệ thống
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <AIAdminAssistant />
      </div>
    </div>
  );
};

export default AdminAIAssistant;