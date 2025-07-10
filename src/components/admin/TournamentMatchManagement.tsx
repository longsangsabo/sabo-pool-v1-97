import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Calendar, Settings, Zap, ArrowRight } from 'lucide-react';
import { useMatchManagement } from '@/hooks/useMatchManagement';
import { MatchScoreEntry } from './MatchScoreEntry';
import { LoadingState } from '@/components/ui/loading-state';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentMatchManagementProps {
  tournament: {
    id: string;
    name: string;
    status: string;
    tournament_type: string;
  };
}

export const TournamentMatchManagement: React.FC<TournamentMatchManagementProps> = ({
  tournament
}) => {
  const {
    matches,
    loading,
    error,
    updateScore,
    startMatch,
    cancelMatch,
    restoreMatch,
    refetchMatches,
    isUpdatingScore,
    isStartingMatch,
    isCancellingMatch,
    isRestoringMatch
  } = useMatchManagement(tournament.id);

  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');
  const [isGeneratingRounds, setIsGeneratingRounds] = useState(false);

  // Generate all tournament rounds
  const handleGenerateAllRounds = async () => {
    try {
      setIsGeneratingRounds(true);
      
      const { data, error } = await supabase.rpc('generate_all_tournament_rounds', {
        p_tournament_id: tournament.id
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast.error(String(data.error));
        return;
      }

      const result = data as any;
      toast.success(`Đã tạo ${result.rounds_created || 0} vòng đấu tiếp theo!`);
      await refetchMatches();
    } catch (error: any) {
      console.error('Error generating rounds:', error);
      toast.error(`Lỗi tạo vòng đấu: ${error?.message || 'Không xác định'}`);
    } finally {
      setIsGeneratingRounds(false);
    }
  };

  if (loading) {
    return <LoadingState text="Đang tải thông tin trận đấu..." variant="card" />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Có lỗi khi tải thông tin trận đấu</p>
            <Button onClick={() => refetchMatches()} className="mt-2">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round_number]) {
      acc[match.round_number] = [];
    }
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const filteredMatches = selectedRound === 'all' 
    ? matches 
    : matchesByRound[selectedRound] || [];

  const getMatchStats = () => {
    const stats = {
      total: matches.length,
      scheduled: matches.filter(m => m.status === 'scheduled').length,
      inProgress: matches.filter(m => m.status === 'in_progress').length,
      completed: matches.filter(m => m.status === 'completed').length,
      cancelled: matches.filter(m => m.status === 'cancelled').length
    };
    return stats;
  };

  const stats = getMatchStats();

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Quản lý trận đấu - {tournament.name}
            </CardTitle>
            <Badge variant="outline">
              {tournament.tournament_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Tổng trận</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.scheduled}</div>
              <div className="text-sm text-muted-foreground">Chưa bắt đầu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">Đang thi đấu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Đã kết thúc</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-muted-foreground">Đã hủy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Điều khiển giải đấu</CardTitle>
            {rounds.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                Vòng {Math.max(...rounds)}/{rounds.length > 1 ? Math.max(...rounds) + 3 : 4}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Generate All Rounds Button */}
            <Button
              onClick={handleGenerateAllRounds}
              disabled={isGeneratingRounds || rounds.length === 0}
              variant="default"
              size="sm"
              className="flex items-center gap-1"
            >
              <Zap className="h-4 w-4" />
              {isGeneratingRounds ? 'Đang tạo...' : 'Tạo tất cả vòng'}
            </Button>

            {/* Round Filter Buttons */}
            {rounds.length > 1 && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  onClick={() => setSelectedRound('all')}
                  variant={selectedRound === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  Tất cả
                </Button>
                {rounds.map(round => (
                  <Button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    variant={selectedRound === round ? 'default' : 'outline'}
                    size="sm"
                  >
                    Vòng {round}
                  </Button>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matches Grid */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map(match => (
              <MatchScoreEntry
                key={match.id}
                match={match}
                onUpdateScore={async (matchId, player1Score, player2Score, winnerId) => {
                  await updateScore({ matchId, player1Score, player2Score, winnerId });
                }}
                onStartMatch={async (matchId) => {
                  await startMatch(matchId);
                }}
                onCancelMatch={async (matchId) => {
                  await cancelMatch(matchId);
                }}
                onRestoreMatch={async (matchId) => {
                  await restoreMatch(matchId);
                }}
                isUpdating={isUpdatingScore}
                isStarting={isStartingMatch}
                isCancelling={isCancellingMatch}
                isRestoring={isRestoringMatch}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có trận đấu nào</h3>
              <p className="text-muted-foreground">
                {selectedRound === 'all' 
                  ? 'Giải đấu chưa có trận đấu nào được tạo'
                  : `Vòng ${selectedRound} chưa có trận đấu nào`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};