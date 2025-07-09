import React from 'react';
import { Code, AlertTriangle, BarChart3, ExternalLink, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelManagement from './ModelManagement';
import { useLanguage } from '@/contexts/LanguageContext';
import QuickRealUserCreator from './QuickRealUserCreator';
import QuickClubCreator from './QuickClubCreator';
import TestDataPopulator from './TestDataPopulator';
import DatabaseResetTools from './DatabaseResetTools';
import TournamentTestingTools from './TournamentTestingTools';
import QuickTournamentCreator from './QuickTournamentCreator';
import { DemoUserManager } from './DemoUserManager';
import SystemMonitoring from './SystemMonitoring';
import CreateAdminAccount from './CreateAdminAccount';
import AutoTranslationWorkflow from './AutoTranslationWorkflow';

const DevelopmentTools = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">{t('admin.dev_tools')}</h1>
      </div>
      
      {/* Phase 2 Analytics Notification */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <BarChart3 className="w-5 h-5" />
            🎉 Phase 2: Enhanced Data Visualization Hoàn Thành!
          </CardTitle>
          <CardDescription className="text-green-700">
            Hệ thống phân tích dữ liệu dịch thuật nâng cao với biểu đồ tương tác và metrics thời gian thực đã sẵn sàng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link 
            to="/admin/analytics" 
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Xem Analytics Dashboard Mới
            <ExternalLink className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('admin.dev_warning')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
          <TabsTrigger value="admin" className="text-xs lg:text-sm">Admin</TabsTrigger>
          <TabsTrigger value="users" className="text-xs lg:text-sm">Users</TabsTrigger>
          <TabsTrigger value="demo" className="text-xs lg:text-sm">Demo</TabsTrigger>
          <TabsTrigger value="clubs" className="text-xs lg:text-sm">Clubs</TabsTrigger>
          <TabsTrigger value="tournaments" className="text-xs lg:text-sm">Tournaments</TabsTrigger>
          <TabsTrigger value="models" className="text-xs lg:text-sm">AI Models</TabsTrigger>
          <TabsTrigger value="translation" className="text-xs lg:text-sm">Translation</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs lg:text-sm">Monitor</TabsTrigger>
          <TabsTrigger value="data" className="text-xs lg:text-sm">Data</TabsTrigger>
          <TabsTrigger value="reset" className="text-xs lg:text-sm">Reset</TabsTrigger>
        </TabsList>
        
        <TabsContent value="admin" className="space-y-4">
          <CreateAdminAccount />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <QuickRealUserCreator />
        </TabsContent>
        
        <TabsContent value="demo" className="space-y-4">
          <DemoUserManager />
        </TabsContent>
        
        <TabsContent value="clubs" className="space-y-4">
          <QuickClubCreator />
        </TabsContent>
        
        <TabsContent value="tournaments" className="space-y-4">
          <QuickTournamentCreator />
          <TournamentTestingTools />
        </TabsContent>
        
        <TabsContent value="models" className="space-y-4">
          <ModelManagement />
        </TabsContent>
        
        <TabsContent value="translation" className="space-y-4">
          <AutoTranslationWorkflow />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-4">
          <SystemMonitoring />
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <TestDataPopulator />
        </TabsContent>
        
        <TabsContent value="reset" className="space-y-4">
          <DatabaseResetTools />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentTools;