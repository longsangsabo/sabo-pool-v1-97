
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus } from 'lucide-react';
import { DemoUserManager } from './DemoUserManager';
import QuickRealUserCreator from './QuickRealUserCreator';

interface UserTestingManagerProps {
  addLog?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

const UserTestingManager: React.FC<UserTestingManagerProps> = ({ addLog }) => {
  const [activeTab, setActiveTab] = useState('demo');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-lg">User Testing Manager</CardTitle>
            <CardDescription>Manage demo users and create test accounts</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demo Users
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Real Users
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="demo" className="mt-4">
            <DemoUserManager addLog={addLog} />
          </TabsContent>
          
          <TabsContent value="create" className="mt-4">
            <QuickRealUserCreator />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserTestingManager;
