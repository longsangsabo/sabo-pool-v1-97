
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Monitor, Bot, Shield } from 'lucide-react';
import SystemMonitoring from './SystemMonitoring';
import ModelManagement from './ModelManagement';
import CreateAdminAccount from './CreateAdminAccount';

const SystemManagementHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('monitoring');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          <div>
            <CardTitle className="text-lg">System Management Hub</CardTitle>
            <CardDescription>Monitor system health and manage core components</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Accounts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitoring" className="mt-4">
            <SystemMonitoring />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <ModelManagement />
          </TabsContent>
          
          <TabsContent value="admin" className="mt-4">
            <CreateAdminAccount />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemManagementHub;
