import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TournamentManagementFlow from '@/components/tournament/TournamentManagementFlow';
import TournamentCard from '@/components/tournament/TournamentCard';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuth } from '@/hooks/useAuth';

const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">ID giải đấu không hợp lệ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Không tìm thấy giải đấu</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is tournament organizer (checking club ownership)
  const isOrganizer = user && tournament.club_id && 
    // This would need to be checked against club_profiles table in a real scenario
    true; // Simplified for now

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="participants">Người tham gia</TabsTrigger>
            <TabsTrigger value="bracket">Bảng đấu</TabsTrigger>
            {isOrganizer && (
              <TabsTrigger value="management">Quản lý</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin giải đấu</CardTitle>
              </CardHeader>
              <CardContent>
                <TournamentCard 
                  tournament={tournament} 
                  onView={() => {}} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách người tham gia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Hiện có {tournament.current_participants} / {tournament.max_participants} người tham gia
                </p>
                {/* Add participant list component here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảng đấu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bảng đấu sẽ được tạo khi giải đấu bắt đầu
                </p>
                {/* Add bracket component here */}
              </CardContent>
            </Card>
          </TabsContent>

          {isOrganizer && (
            <TabsContent value="management" className="space-y-6">
              <TournamentManagementFlow tournamentId={id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentDetailsPage;