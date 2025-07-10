import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, Gift, DollarSign, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TournamentRewardsButton } from './TournamentRewardsButton';
import { RankingService } from '@/services/rankingService';

interface TournamentResultsProps {
  tournamentId: string;
  tournamentName: string;
}

interface ClubReward {
  type: 'cash' | 'physical';
  description: string;
  value?: number;
}

interface TournamentReward {
  position: number;
  cashPrize: number;
  physicalPrizes: string[];
}

interface ParticipantResult {
  player_id: string;
  full_name: string;
  display_name: string;
  avatar_url?: string;
  position: number;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  spa_points_earned: number;
  matches_played: number;
  wins: number;
  losses: number;
  current_rank_id: string;
}

export const TournamentResults: React.FC<TournamentResultsProps> = ({
  tournamentId,
  tournamentName
}) => {
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [champion, setChampion] = useState<ParticipantResult | null>(null);
  const [clubRewards, setClubRewards] = useState<TournamentReward[]>([]);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    fetchTournamentResults();
  }, [tournamentId]);

  const fetchTournamentResults = async () => {
    try {
      // Get tournament info
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
      
      setTournament(tournamentData);

      // Get tournament seeding/final positions from bracket
      const { data: seeding } = await supabase
        .from('tournament_seeding')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed_position');

      // Get final matches to determine positions
      const { data: finalMatches } = await supabase
        .from('tournament_matches')
        .select(`
          winner_id,
          player1_id,
          player2_id,
          round_number,
          is_third_place_match
        `)
        .eq('tournament_id', tournamentId)
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .in('round_number', [
          ...(await supabase
            .from('tournament_matches')
            .select('round_number')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: false })
            .limit(1)
            .then(res => res.data ? [res.data[0].round_number] : [])
          )
        ]);

      // Separate final and third place matches
      const finalMatch = finalMatches?.find(m => !m.is_third_place_match);
      const thirdPlaceMatch = finalMatches?.find(m => m.is_third_place_match);

      // Get all participants with their match results
      const { data: participants } = await supabase
        .from('tournament_registrations')
        .select(`
          player_id,
          profiles:player_id (
            full_name,
            display_name,
            avatar_url
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (!participants) return;

      // Get match results for ELO changes
      const { data: matchResults } = await supabase
        .from('match_results')
        .select('*')
        .eq('tournament_id', tournamentId);

      // Get player rankings for current ELO/SPA
      const { data: playerRankings } = await supabase
        .from('player_rankings')
        .select('*');

      // Get SPA points log
      const { data: spaPoints } = await supabase
        .from('spa_points_log')
        .select('*')
        .eq('source_id', tournamentId)
        .eq('source_type', 'tournament');

      // Process results
      const processedResults: ParticipantResult[] = participants.map((participant, index) => {
        const playerId = participant.player_id;
        const profile = participant.profiles as any;
        
        // Get current player rankings
        const ranking = playerRankings?.find(r => r.player_id === playerId);
        const currentElo = ranking?.elo_points || 1000;
        const currentRank = ranking?.current_rank_id || 'K';
        
        // Calculate position based on tournament results
        let position = 99; // Default to last place
        
        if (finalMatch) {
          if (playerId === finalMatch.winner_id) {
            position = 1; // Champion
          } else if (playerId === finalMatch.player1_id || playerId === finalMatch.player2_id) {
            position = 2; // Runner-up (finalist who didn't win)
          }
        }
        
        if (thirdPlaceMatch) {
          if (playerId === thirdPlaceMatch.winner_id) {
            position = 3; // Third place
          } else if (playerId === thirdPlaceMatch.player1_id || playerId === thirdPlaceMatch.player2_id) {
            position = 4; // Fourth place
          }
        }
        
        // For other participants, use participation position (5+)
        if (position === 99) {
          position = Math.min(index + 5, participants.length); // 5th place and below
        }

        // Calculate expected rewards based on position and rank
        const tournamentPosition = position === 1 ? 'CHAMPION' : 
                                  position === 2 ? 'RUNNER_UP' :
                                  position === 3 ? 'THIRD_PLACE' :
                                  position === 4 ? 'FOURTH_PLACE' :
                                  position <= 8 ? 'TOP_8' :
                                  position <= 16 ? 'TOP_16' : 'PARTICIPATION';
        
        const validRank = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'].includes(currentRank) ? currentRank as any : 'K';
        const expectedRewards = RankingService.calculateTournamentRewards(tournamentPosition as any, validRank);

        // Get actual ELO changes from match results
        const playerMatches = matchResults?.filter(m => 
          m.player1_id === playerId || m.player2_id === playerId
        ) || [];

        let actualEloChange = 0;
        let eloBefore = currentElo;
        let eloAfter = currentElo;
        let wins = 0;
        let losses = 0;

        if (playerMatches.length > 0) {
          playerMatches.forEach(match => {
            if (match.player1_id === playerId) {
              actualEloChange += match.player1_elo_change || 0;
              eloBefore = match.player1_elo_before || currentElo;
              eloAfter = match.player1_elo_after || currentElo;
              if (match.winner_id === playerId) wins++;
              else if (match.winner_id) losses++;
            } else {
              actualEloChange += match.player2_elo_change || 0;
              eloBefore = match.player2_elo_before || currentElo;
              eloAfter = match.player2_elo_after || currentElo;
              if (match.winner_id === playerId) wins++;
              else if (match.winner_id) losses++;
            }
          });
        } else {
          // Use expected ELO change if no match results
          actualEloChange = expectedRewards.eloPoints;
          eloAfter = eloBefore + actualEloChange;
        }

        // Get actual SPA points from log or use expected
        const spaLog = spaPoints?.find(sp => sp.player_id === playerId);
        const spaPointsEarned = spaLog?.points_earned || expectedRewards.spaPoints;

        return {
          player_id: playerId,
          full_name: profile?.full_name || 'Unknown',
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url,
          position,
          elo_before: eloBefore,
          elo_after: eloAfter,
          elo_change: actualEloChange,
          spa_points_earned: spaPointsEarned,
          matches_played: playerMatches.length,
          wins,
          losses,
          current_rank_id: currentRank
        };
      });

      // Sort by position (1st, 2nd, then by SPA points for others)
      const sortedResults = processedResults.sort((a, b) => {
        if (a.position === 1) return -1;
        if (b.position === 1) return 1;
        if (a.position === 2) return -1;
        if (b.position === 2) return 1;
        return b.spa_points_earned - a.spa_points_earned;
      });

      setResults(sortedResults);
      setChampion(sortedResults.find(r => r.position === 1) || null);

      // Load club rewards (mock data for now - in real app, get from tournament settings)
      setClubRewards([
        { position: 1, cashPrize: 2000000, physicalPrizes: ['Cúp vô địch', 'Kỉ niệm chương vàng'] },
        { position: 2, cashPrize: 1000000, physicalPrizes: ['Cúp á quân', 'Kỉ niệm chương bạc'] },
        { position: 3, cashPrize: 500000, physicalPrizes: ['Cúp hạng 3', 'Kỉ niệm chương đồng'] },
      ]);
      
    } catch (error) {
      console.error('Error fetching tournament results:', error);
      toast.error('Không thể tải kết quả giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPositionText = (position: number) => {
    if (position === 1) return 'Vô địch';
    if (position === 2) return 'Á quân';
    if (position === 3) return 'Hạng 3';
    return `Hạng ${position}`;
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Champion Highlight */}
      {champion && (
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-yellow-400">
                  <AvatarImage src={champion.avatar_url} />
                  <AvatarFallback className="text-lg font-bold">
                    {champion.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl text-yellow-800">
              🏆 {champion.display_name}
            </CardTitle>
            <p className="text-yellow-700 font-medium">
              Vô địch {tournamentName}
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-yellow-800">+{champion.spa_points_earned}</div>
                <div className="text-yellow-600">SPA Points</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-800">
                  {champion.elo_change > 0 ? '+' : ''}{champion.elo_change}
                </div>
                <div className="text-yellow-600">ELO</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-800">
                  {champion.wins}-{champion.losses}
                </div>
                <div className="text-yellow-600">Thắng-Thua</div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Podium (Top 3) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Podium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.slice(0, 3).map((result, index) => (
              <div
                key={result.player_id}
                className={`p-4 rounded-lg border-2 text-center ${
                  index === 0 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : index === 1 
                    ? 'border-gray-400 bg-gray-50' 
                    : 'border-amber-400 bg-amber-50'
                }`}
              >
                <div className="flex justify-center mb-2">
                  {getPositionIcon(result.position)}
                </div>
                <Avatar className="w-12 h-12 mx-auto mb-2">
                  <AvatarImage src={result.avatar_url} />
                  <AvatarFallback>{result.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{result.display_name}</h3>
                <Badge className={`mt-2 ${getPositionBadgeColor(result.position)}`}>
                  {getPositionText(result.position)}
                </Badge>
                <div className="mt-2 text-sm text-muted-foreground">
                  +{result.spa_points_earned} SPA • {result.elo_change > 0 ? '+' : ''}{result.elo_change} ELO
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bảng xếp hạng chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={result.player_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.position <= 3 ? 'border-primary/20 bg-primary/5' : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[80px]">
                    {getPositionIcon(result.position)}
                    <Badge 
                      variant={result.position <= 3 ? 'default' : 'secondary'}
                      className={result.position <= 3 ? getPositionBadgeColor(result.position) : ''}
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={result.avatar_url} />
                    <AvatarFallback>{result.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">{result.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.full_name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-primary">+{result.spa_points_earned}</div>
                    <div className="text-muted-foreground">SPA</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-bold ${result.elo_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.elo_change > 0 ? '+' : ''}{result.elo_change}
                    </div>
                    <div className="text-muted-foreground">ELO</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold">{result.wins}-{result.losses}</div>
                    <div className="text-muted-foreground">W-L</div>
                  </div>
                  
                  <div className="text-center hidden md:block">
                    <div className="font-bold">{result.elo_before} → {result.elo_after}</div>
                    <div className="text-muted-foreground">ELO</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Club Rewards */}
      {clubRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Giải thưởng từ Club
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clubRewards.map((reward) => (
                <div key={reward.position} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getPositionIcon(reward.position)}
                    <div>
                      <div className="font-medium">{getPositionText(reward.position)}</div>
                      <div className="text-sm text-muted-foreground">
                        {reward.physicalPrizes.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-green-600">
                      <DollarSign className="w-4 h-4" />
                      {reward.cashPrize.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPA/ELO Rules Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Thông tin điểm thưởng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Xem chi tiết quy định tính điểm ELO và SPA cho các vị trí trong giải đấu
              </p>
              <p className="text-xs text-muted-foreground">
                Điểm SPA phụ thuộc vào rank hiện tại • ELO tính theo vị trí cuối cùng
              </p>
            </div>
            <TournamentRewardsButton 
              playerRank={(champion?.current_rank_id as any) || 'K'}
              size="default"
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Thống kê giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{results.length}</div>
              <div className="text-sm text-muted-foreground">Người tham gia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {results.reduce((sum, r) => sum + r.matches_played, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Tổng trận đấu</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {results.reduce((sum, r) => sum + r.spa_points_earned, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Tổng SPA trao</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(results.reduce((sum, r) => sum + Math.abs(r.elo_change), 0) / results.length)}
              </div>
              <div className="text-sm text-muted-foreground">TB ELO thay đổi</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentResults;