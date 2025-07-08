import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ArrowRight,
  Crown,
  Medal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BracketVisualizationProps {
  tournamentId: string;
  onClose?: () => void;
}

interface MatchData {
  id: string;
  round_number: number;
  match_number: number;
  player1_name?: string;
  player2_name?: string;
  player1_id?: string;
  player2_id?: string;
  status: string;
  winner_id?: string;
  scheduled_time?: string;
}

interface BracketData {
  tournament_id: string;
  tournament_type: string;
  bracket_size: number;
  participant_count: number;
  rounds: number;
  participants: any[];
  matches: any[];
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  tournamentId,
  onClose
}) => {
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBracketData();
  }, [tournamentId]);

  const fetchBracketData = async () => {
    try {
      setLoading(true);
      
      // Fetch bracket data
      const { data: bracket, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketError) throw bracketError;

      // Fetch matches with player names
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!player1_id(full_name, display_name),
          player2:profiles!player2_id(full_name, display_name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) throw matchesError;

      setBracketData(bracket.bracket_data as unknown as BracketData);
      setMatches(matchesData?.map(match => ({
        id: match.id,
        round_number: match.round_number,
        match_number: match.match_number,
        player1_name: match.player1?.full_name || match.player1?.display_name || (match.player1_id ? 'Unknown' : 'BYE'),
        player2_name: match.player2?.full_name || match.player2?.display_name || (match.player2_id ? 'Unknown' : 'BYE'),
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        status: match.status,
        winner_id: match.winner_id,
        scheduled_time: match.scheduled_time
      })) || []);

    } catch (error) {
      console.error('Error fetching bracket data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.round_number === round);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Chung Kết';
    if (round === totalRounds - 1) return 'Bán Kết';
    if (round === totalRounds - 2) return 'Tứ Kết';
    return `Vòng ${round}`;
  };

  const getMatchHeight = (totalRounds: number, currentRound: number) => {
    const baseHeight = 80;
    const multiplier = Math.pow(2, currentRound - 1);
    return baseHeight * multiplier;
  };

  const getMatchTopMargin = (totalRounds: number, currentRound: number, matchIndex: number) => {
    if (currentRound === 1) return matchIndex * 100;
    
    const prevRoundHeight = getMatchHeight(totalRounds, currentRound - 1);
    const currentHeight = getMatchHeight(totalRounds, currentRound);
    const gap = (currentHeight - prevRoundHeight) / 2;
    
    return matchIndex * currentHeight + gap;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Trophy className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Đang tải sơ đồ giải đấu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bracketData) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <p>Không tìm thấy dữ liệu bảng đấu</p>
        </CardContent>
      </Card>
    );
  }

  const totalRounds = bracketData.rounds;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Sơ Đồ Giải Đấu
            </CardTitle>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{bracketData.participant_count} Người chơi</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Medal className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{totalRounds} Vòng đấu</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{bracketData.tournament_type}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Bracket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bảng Đấu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-8 min-w-max p-4" style={{ minHeight: `${Math.pow(2, totalRounds - 1) * 100}px` }}>
              {Array.from({ length: totalRounds }, (_, roundIndex) => {
                const round = roundIndex + 1;
                const roundMatches = getMatchesByRound(round);
                
                return (
                  <div key={round} className="flex flex-col relative min-w-[250px]">
                    {/* Round Header */}
                    <div className="sticky top-0 bg-background z-10 pb-4">
                      <Badge variant="outline" className="w-full justify-center py-2">
                        {getRoundName(round, totalRounds)}
                      </Badge>
                    </div>
                    
                    {/* Matches */}
                    <div className="relative flex-1">
                      {roundMatches.map((match, matchIndex) => (
                        <div
                          key={match.id}
                          className="absolute w-full"
                          style={{
                            top: `${getMatchTopMargin(totalRounds, round, matchIndex)}px`,
                            height: `${getMatchHeight(totalRounds, round) - 20}px`
                          }}
                        >
                          <Card className={`h-full ${match.winner_id ? 'border-green-500' : 'border-border'}`}>
                            <CardContent className="p-3 h-full flex flex-col justify-center">
                              {/* Player 1 */}
                              <div className={`flex items-center justify-between p-2 rounded mb-1 ${
                                match.winner_id === match.player1_id ? 'bg-green-100 text-green-800' : 
                                match.player1_id ? 'bg-muted' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <span className="text-sm font-medium truncate">
                                  {match.player1_name}
                                </span>
                                {match.winner_id === match.player1_id && (
                                  <Crown className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              
                              {/* VS */}
                              <div className="text-center py-1">
                                <span className="text-xs text-muted-foreground">VS</span>
                              </div>
                              
                              {/* Player 2 */}
                              <div className={`flex items-center justify-between p-2 rounded mt-1 ${
                                match.winner_id === match.player2_id ? 'bg-green-100 text-green-800' : 
                                match.player2_id ? 'bg-muted' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <span className="text-sm font-medium truncate">
                                  {match.player2_name}
                                </span>
                                {match.winner_id === match.player2_id && (
                                  <Crown className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              
                              {/* Match Status */}
                              <div className="mt-2 text-center">
                                <Badge variant={
                                  match.status === 'completed' ? 'default' :
                                  match.status === 'ongoing' ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {match.status === 'completed' ? 'Kết thúc' :
                                   match.status === 'ongoing' ? 'Đang đấu' : 'Chưa đấu'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                    
                    {/* Connection Lines */}
                    {round < totalRounds && (
                      <div className="absolute -right-4 top-0 bottom-0 flex items-center">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
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

export default BracketVisualization;