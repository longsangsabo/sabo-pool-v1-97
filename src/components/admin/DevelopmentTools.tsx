import React from 'react';
import { Code, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import QuickRealUserCreator from './QuickRealUserCreator';
import QuickClubCreator from './QuickClubCreator';
import TestDataPopulator from './TestDataPopulator';
import DatabaseResetTools from './DatabaseResetTools';
import TournamentTestingTools from './TournamentTestingTools';
import QuickTournamentCreator from './QuickTournamentCreator';
import { DemoUserManager } from './DemoUserManager';
import SystemMonitoring from './SystemMonitoring';

const DevelopmentTools = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">{t('admin.dev_tools')}</h1>
      </div>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('admin.dev_warning')}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">{t('admin.bulk_user_gen')}</TabsTrigger>
          <TabsTrigger value="demo">Demo Users</TabsTrigger>
          <TabsTrigger value="clubs">{t('admin.quick_club')}</TabsTrigger>
          <TabsTrigger value="tournaments">Tournament Test</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitor</TabsTrigger>
          <TabsTrigger value="data">{t('admin.test_data')}</TabsTrigger>
          <TabsTrigger value="reset">{t('admin.db_tools')}</TabsTrigger>
        </TabsList>
        
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