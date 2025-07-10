import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const TournamentRewardsManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tournament Rewards Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Tournament rewards management coming soon...</p>
      </CardContent>
    </Card>
  );
};