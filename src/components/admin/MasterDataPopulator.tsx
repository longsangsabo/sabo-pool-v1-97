
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Package, Users2, Trophy } from 'lucide-react';
import TestDataPopulator from './TestDataPopulator';

const MasterDataPopulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-green-600" />
          <div>
            <CardTitle className="text-lg">Master Data Populator</CardTitle>
            <CardDescription>Centralized test data generation and population</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs">
              <Users2 className="h-3 w-3" />
              Users
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-1 text-xs">
              <Trophy className="h-3 w-3" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-1 text-xs">
              <Database className="h-3 w-3" />
              Matches
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4">
            <TestDataPopulator />
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <div className="text-center text-gray-500 p-8">
              <Users2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>User-specific data population tools coming soon...</p>
              <p className="text-sm mt-2">Use the User Testing Manager for now</p>
            </div>
          </TabsContent>
          
          <TabsContent value="tournaments" className="mt-4">
            <div className="text-center text-gray-500 p-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Tournament-specific data population tools coming soon...</p>
              <p className="text-sm mt-2">Use the Tournament Test Manager for now</p>
            </div>
          </TabsContent>
          
          <TabsContent value="matches" className="mt-4">
            <div className="text-center text-gray-500 p-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Match data population tools coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MasterDataPopulator;
