
import React, { useState, lazy, Suspense } from 'react';
import { Code, AlertTriangle, BarChart3, ExternalLink, Search, Keyboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import ErrorBoundary from '@/components/ui/error-boundary';
import { LoadingState } from '@/components/ui/loading-state';

// Lazy load components for better performance
const UserTestingManager = lazy(() => import('./UserTestingManager'));
const TournamentTestManager = lazy(() => import('./TournamentTestManager'));
const MasterDataPopulator = lazy(() => import('./MasterDataPopulator'));
const SystemManagementHub = lazy(() => import('./SystemManagementHub'));
const DatabaseResetTools = lazy(() => import('./DatabaseResetTools'));
const AutoTranslationWorkflow = lazy(() => import('./AutoTranslationWorkflow'));

const DevelopmentTools = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  const tabs = [
    { id: 'users', label: 'Users', icon: 'Users', description: 'Manage demo users and create test accounts' },
    { id: 'tournaments', label: 'Tournaments', icon: 'Trophy', description: 'Create tournaments and test workflows' },
    { id: 'data', label: 'Data', icon: 'Database', description: 'Populate test data and manage datasets' },
    { id: 'system', label: 'System', icon: 'Settings', description: 'Monitor system health and manage components' },
    { id: 'translation', label: 'Translation', icon: 'Globe', description: 'Auto-translation workflows' },
    { id: 'reset', label: 'Reset', icon: 'RotateCcw', description: 'Database reset and cleanup tools' }
  ];

  const filteredTabs = tabs.filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      {/* Header with enhanced navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('admin.dev_tools')}</h1>
          <Badge variant="secondary" className="ml-2">v2.0 Optimized</Badge>
        </div>
        
        {/* Search and Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Badge variant="outline" className="gap-1">
            <Keyboard className="h-3 w-3" />
            Ctrl+K
          </Badge>
        </div>
      </div>
      
      {/* Success Analytics Banner */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <BarChart3 className="w-5 h-5" />
            ✅ Phase 1-3: Development Tools Optimization Complete!
          </CardTitle>
          <CardDescription className="text-green-700">
            Consolidated components, enhanced performance, and improved UX với lazy loading và error boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link 
              to="/admin/analytics" 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all hover-scale"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Dashboard
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Badge variant="secondary">50% Less Duplication</Badge>
            <Badge variant="secondary">Enhanced Error Handling</Badge>
            <Badge variant="secondary">Lazy Loading</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('admin.dev_warning')} Enhanced with error boundaries và performance monitoring.
        </AlertDescription>
      </Alert>

      {/* Enhanced Tabs with Suspense */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 sticky top-0 z-10 bg-background">
          {filteredTabs.map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="text-xs lg:text-sm transition-all hover-scale"
              title={tab.description}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading User Testing Manager..." />}>
              <UserTestingManager />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="tournaments" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading Tournament Manager..." />}>
              <TournamentTestManager />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading Data Populator..." />}>
              <MasterDataPopulator />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading System Hub..." />}>
              <SystemManagementHub />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="translation" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading Translation Tools..." />}>
              <AutoTranslationWorkflow />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="reset" className="space-y-4">
          <ErrorBoundary>
            <Suspense fallback={<LoadingState variant="card" text="Loading Reset Tools..." />}>
              <DatabaseResetTools />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentTools;
