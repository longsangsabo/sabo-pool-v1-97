
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Zap, TestTube, Settings } from 'lucide-react';
import QuickTournamentCreator from './QuickTournamentCreator';
import CustomTournamentCreator from './CustomTournamentCreator';
import TournamentTestingTools from './TournamentTestingTools';

const TournamentTestManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <div>
            <CardTitle className="text-lg">Tournament Test Manager</CardTitle>
            <CardDescription>Create tournaments and test tournament workflows</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Create
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Create
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Full Testing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="mt-4">
            <QuickTournamentCreator />
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4">
            <CustomTournamentCreator />
          </TabsContent>
          
          <TabsContent value="testing" className="mt-4">
            <TournamentTestingTools />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TournamentTestManager;
