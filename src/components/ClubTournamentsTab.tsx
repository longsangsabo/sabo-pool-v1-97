import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CreditCard } from 'lucide-react';
import ClubTournamentManagement from '@/components/ClubTournamentManagement';
import TournamentPaymentManager from '@/components/TournamentPaymentManager';

const ClubTournamentsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Giải đấu & Thanh toán</h2>
        <p className="text-muted-foreground">
          Quản lý các giải đấu và xử lý thanh toán của câu lạc bộ
        </p>
      </div>
      
      <Tabs defaultValue="tournaments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Quản lý giải đấu
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Thanh toán
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <ClubTournamentManagement />
        </TabsContent>

        <TabsContent value="payments">
          <TournamentPaymentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubTournamentsTab;