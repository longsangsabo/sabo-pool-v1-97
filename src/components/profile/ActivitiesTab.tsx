import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, History, Calendar } from 'lucide-react';
import MyChallengesTab from '@/components/MyChallengesTab';

const ActivitiesTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thách đấu & Hoạt động</h2>
        <p className="text-muted-foreground">
          Quản lý các thách đấu và theo dõi lịch sử hoạt động của bạn
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thách đấu đang chờ</p>
                <p className="text-3xl font-bold text-foreground">3</p>
              </div>
              <Gamepad2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trận đấu tuần này</p>
                <p className="text-3xl font-bold text-foreground">5</p>
              </div>
              <History className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Giải đấu sắp tới</p>
                <p className="text-3xl font-bold text-foreground">2</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenges Component */}
      <MyChallengesTab />
    </div>
  );
};

export default ActivitiesTab;