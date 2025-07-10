import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TournamentManagementFlow from '@/components/tournament/TournamentManagementFlow';
import TournamentCard from '@/components/tournament/TournamentCard';
import TournamentParticipantsList from '@/components/tournament/TournamentParticipantsList';
import TournamentResults from '@/components/tournament/TournamentResults';
import { RealtimeBracketViewer } from '@/components/tournament/RealtimeBracketViewer';
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

  const isCompleted = tournament.status === 'completed';
  const tabsCount = isCompleted ? (isOrganizer ? 5 : 4) : (isOrganizer ? 4 : 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tournament Status Banner for Completed */}
        {isCompleted && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-green-600 text-white">Đã hoàn thành</Badge>
              <span className="text-green-800 font-medium">
                🏆 Giải đấu "{tournament.name}" đã kết thúc
              </span>
            </div>
          </div>
        )}

        <Tabs defaultValue={isCompleted ? "results" : "overview"} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${tabsCount}`}>
            {isCompleted && (
              <TabsTrigger value="results">🏆 Kết quả</TabsTrigger>
            )}
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="participants">Người tham gia</TabsTrigger>
            <TabsTrigger value="bracket">Bảng đấu</TabsTrigger>
            {isOrganizer && (
              <TabsTrigger value="management">Quản lý</TabsTrigger>
            )}
          </TabsList>

          {/* Results Tab - Only for completed tournaments */}
          {isCompleted && (
            <TabsContent value="results" className="space-y-6">
              <TournamentResults 
                tournamentId={tournament.id}
                tournamentName={tournament.name}
              />
            </TabsContent>
          )}

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isCompleted && <Badge className="bg-green-600 text-white">Đã hoàn thành</Badge>}
                  Thông tin giải đấu
                </CardTitle>
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
            <TournamentParticipantsList 
              tournamentId={tournament.id}
              maxParticipants={tournament.max_participants}
            />
          </TabsContent>

          <TabsContent value="bracket" className="space-y-6">
            <RealtimeBracketViewer tournamentId={tournament.id} />
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