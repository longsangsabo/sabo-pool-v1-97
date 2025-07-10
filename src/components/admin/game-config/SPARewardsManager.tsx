import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export const SPARewardsManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          SPA Rewards Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">SPA rewards management coming soon...</p>
      </CardContent>
    </Card>
  );
};