import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Crown,
  User,
  Calendar,
  Clock,
  Target,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TournamentBracketViewerProps {
  tournamentId: string;
  canManage?: boolean;
}

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  status: string;
  scheduled_time?: string;
  score_player1?: number;
  score_player2?: number;
  player1?: {
    display_name: string;
    elo?: number;
  };
  player2?: {
    display_name: string;
    elo?: number;
  };
  winner?: {
    display_name: string;
  };
}

export const TournamentBracketViewer: React.FC<TournamentBracketViewerProps> = ({
  tournamentId,
  canManage = false
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [tournamentId]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(display_name, elo),
          player2:profiles!tournament_matches_player2_id_fkey(display_name, elo),
          winner:profiles!tournament_matches_winner_id_fkey(display_name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;

      setMatches((data as any) || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMatches = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const groupMatchesByRound = (matches: Match[]) => {
    return matches.reduce((acc, match) => {
      if (!acc[match.round_number]) {
        acc[match.round_number] = [];
      }
      acc[match.round_number].push(match);
      return acc;
    }, {} as Record<number, Match[]>);
  };

  const getRoundName = (round: number, maxRound: number) => {
    if (round === maxRound) return 'Chung kết';
    if (round === maxRound - 1) return 'Bán kết';
    if (round === maxRound - 2) return 'Tứ kết';
    return `Vòng ${round}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'ongoing': return 'destructive';
      case 'scheduled': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'ongoing': return 'Đang đấu';
      case 'scheduled': return 'Chờ đấu';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Đang tải bảng đấu...</span>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Chưa có bảng đấu
            </h3>
            <p className="text-muted-foreground mb-4">
              Bảng đấu chưa được tạo cho giải đấu này.
            </p>
            {canManage && (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Sử dụng tab "Quản lý" để tạo bảng đấu.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const roundGroups = groupMatchesByRound(matches);
  const maxRound = Math.max(...Object.keys(roundGroups).map(Number));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Bảng Đấu Tournament
            </CardTitle>
            <Button 
              onClick={refreshMatches}
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Cập nhật
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{matches.length}</div>
              <div className="text-sm text-muted-foreground">Tổng trận đấu</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </div>
              <div className="text-sm text-muted-foreground">Còn lại</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Display */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {Object.keys(roundGroups)
                .sort((a, b) => Number(a) - Number(b))
                .map(round => {
                  const roundNum = Number(round);
                  const roundMatches = roundGroups[roundNum];
                  
                  return (
                    <div key={round} className="min-w-80">
                      <div className="sticky top-0 bg-background border-b pb-3 mb-4">
                        <h4 className="font-medium text-center py-2 bg-muted rounded text-sm">
                          {getRoundName(roundNum, maxRound)}
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        {roundMatches.map(match => (
                          <div key={match.id} className="border rounded-lg p-4 bg-card">
                            <div className="text-xs text-muted-foreground mb-3 text-center">
                              Trận {match.match_number}
                            </div>
                            
                            <div className="space-y-3">
                              {/* Player 1 */}
                              <div className={`p-3 rounded-md text-sm border transition-colors ${
                                match.winner_id === match.player1_id 
                                  ? 'bg-green-50 border-green-300 text-green-900 font-medium' 
                                  : 'bg-background'
                              }`}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {match.winner_id === match.player1_id && (
                                      <Crown className="h-3 w-3 text-yellow-600" />
                                    )}
                                    <span>{match.player1?.display_name || 'TBD'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {match.player1?.elo && (
                                      <span>ELO: {match.player1.elo}</span>
                                    )}
                                    {match.score_player1 !== undefined && (
                                      <Badge variant="outline" className="text-xs">
                                        {match.score_player1}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                                <User className="h-3 w-3" />
                                vs
                              </div>
                              
                              {/* Player 2 */}
                              <div className={`p-3 rounded-md text-sm border transition-colors ${
                                match.winner_id === match.player2_id 
                                  ? 'bg-green-50 border-green-300 text-green-900 font-medium' 
                                  : 'bg-background'
                              }`}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {match.winner_id === match.player2_id && (
                                      <Crown className="h-3 w-3 text-yellow-600" />
                                    )}
                                    <span>{match.player2?.display_name || 'TBD'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {match.player2?.elo && (
                                      <span>ELO: {match.player2.elo}</span>
                                    )}
                                    {match.score_player2 !== undefined && (
                                      <Badge variant="outline" className="text-xs">
                                        {match.score_player2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Match Status */}
                            <div className="mt-4 flex items-center justify-between">
                              <Badge variant={getStatusColor(match.status)} className="text-xs">
                                {getStatusText(match.status)}
                              </Badge>
                              
                              {match.scheduled_time && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(match.scheduled_time).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                            
                            {/* Winner Display */}
                            {match.winner_id && match.winner && (
                              <div className="mt-3 p-2 bg-green-50 rounded text-center text-sm">
                                <div className="flex items-center justify-center gap-1 text-green-700">
                                  <Trophy className="h-3 w-3" />
                                  <span className="font-medium">{match.winner.display_name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentBracketViewer;