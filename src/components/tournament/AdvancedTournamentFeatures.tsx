import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  BarChart3, 
  Zap,
  Eye,
  Share2
} from 'lucide-react';
import { TournamentRealTimeSync } from './TournamentRealTimeSync';
import { EnhancedRewardsDisplay } from './EnhancedRewardsDisplay';

interface AdvancedTournamentFeaturesProps {
  tournament: any;
  onUpdate?: (tournament: any) => void;
}

export const AdvancedTournamentFeatures: React.FC<AdvancedTournamentFeaturesProps> = ({
  tournament,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTournamentUpdate = (updatedTournament: any) => {
    onUpdate?.(updatedTournament);
  };

  const handleParticipantUpdate = (participant: any) => {
    // Handle participant updates
    console.log('Participant updated:', participant);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Sync Indicator */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý giải đấu nâng cao</h2>
        <TournamentRealTimeSync
          tournamentId={tournament?.id}
          onTournamentUpdate={handleTournamentUpdate}
          onParticipantUpdate={handleParticipantUpdate}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Phân tích
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            Tự động hóa
          </TabsTrigger>
          <TabsTrigger value="sharing" className="gap-2">
            <Share2 className="h-4 w-4" />
            Chia sẻ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Người tham gia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournament?.current_participants || 0}</div>
                <div className="text-xs text-muted-foreground">
                  / {tournament?.max_participants || 0} tối đa
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Giải thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournament?.prize_pool?.toLocaleString('vi-VN') || 0}₫
                </div>
                <div className="text-xs text-muted-foreground">Tổng giải thưởng</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{tournament?.status || 'draft'}</Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {tournament?.tournament_start && 
                    new Date(tournament.tournament_start).toLocaleDateString('vi-VN')
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Rewards Display */}
          {tournament?.rewards && (
            <EnhancedRewardsDisplay
              rewards={tournament.rewards}
              rank={tournament.tier_level}
              entryFee={tournament.entry_fee}
              maxParticipants={tournament.max_participants}
              showFinancialSummary={true}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân tích hiệu suất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Tính năng phân tích sẽ có sẵn khi giải đấu bắt đầu</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quy trình tự động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Tự động cập nhật trạng thái</h4>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật trạng thái giải đấu theo thời gian
                  </p>
                </div>
                <Badge variant="secondary">Bật</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Thông báo tự động</h4>
                  <p className="text-sm text-muted-foreground">
                    Gửi thông báo cho người tham gia
                  </p>
                </div>
                <Badge variant="secondary">Bật</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Tạo bracket tự động</h4>
                  <p className="text-sm text-muted-foreground">
                    Tự động tạo bracket khi đủ người tham gia
                  </p>
                </div>
                <Badge variant="outline">Tắt</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chia sẻ giải đấu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Chia sẻ link
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Cài đặt chia sẻ
                </Button>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Link công khai:</p>
                <code className="text-xs bg-background p-2 rounded border block">
                  {window.location.origin}/tournaments/{tournament?.id}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedTournamentFeatures;