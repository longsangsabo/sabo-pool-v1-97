import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import RealtimeStatus from '@/components/RealtimeStatus';
import { toast } from 'sonner';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  player1?: { full_name: string };
  player2?: { full_name: string };
  score_player1?: number;
  score_player2?: number;
}

interface RealtimeBracketViewerProps {
  tournamentId: string;
}

export const RealtimeBracketViewer: React.FC<RealtimeBracketViewerProps> = ({
  tournamentId
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const { isConnected, lastUpdate } = useRealtimeTournamentSync(tournamentId);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(full_name),
          player2:profiles!tournament_matches_player2_id_fkey(full_name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Lỗi khi tải dữ liệu trận đấu');
    }
  };

  const fetchTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchTournament();
  }, [tournamentId]);

  // Refresh when realtime updates occur
  useEffect(() => {
    if (lastUpdate) {
      fetchMatches();
      fetchTournament();
    }
  }, [lastUpdate]);

  const getMatchStatus = (match: Match) => {
    if (match.status === 'completed') {
      return <Badge className="bg-green-500">Hoàn thành</Badge>;
    } else if (match.status === 'ongoing') {
      return <Badge className="bg-blue-500">Đang diễn ra</Badge>;
    } else if (!match.player1_id || !match.player2_id) {
      return <Badge variant="secondary">Chờ thí sinh</Badge>;
    } else {
      return <Badge variant="outline">Chưa bắt đầu</Badge>;
    }
  };

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.round_number]) {
      acc[match.round_number] = [];
    }
    acc[match.round_number].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tournament Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {tournament?.name}
            </CardTitle>
            <div className="flex items-center gap-4">
              <RealtimeStatus isConnected={isConnected} lastUpdate={lastUpdate} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchMatches();
                  fetchTournament();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Thí sinh: {tournament?.current_participants || 0}/{tournament?.max_participants || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Trạng thái: {tournament?.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>Loại: {tournament?.tournament_type}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Display */}
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <Card key={round}>
            <CardHeader>
              <CardTitle className="text-lg">
                Vòng {round} ({roundMatches.length} trận)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roundMatches.map((match) => (
                  <Card key={match.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Trận {match.match_number}
                          </span>
                          {getMatchStatus(match)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className={`flex justify-between items-center p-2 rounded ${
                            match.winner_id === match.player1_id ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                          }`}>
                            <span className="font-medium">
                              {match.player1?.full_name || 'TBD'}
                            </span>
                            {match.status === 'completed' && (
                              <span className="font-bold">
                                {match.score_player1 || 0}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-center text-xs text-muted-foreground">
                            VS
                          </div>
                          
                          <div className={`flex justify-between items-center p-2 rounded ${
                            match.winner_id === match.player2_id ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                          }`}>
                            <span className="font-medium">
                              {match.player2?.full_name || 'TBD'}
                            </span>
                            {match.status === 'completed' && (
                              <span className="font-bold">
                                {match.score_player2 || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {matches.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có bảng đấu nào được tạo</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};