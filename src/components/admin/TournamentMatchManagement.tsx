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
  const [isCompletingTournament, setIsCompletingTournament] = useState(false);

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

  // Complete tournament
  const handleCompleteTournament = async () => {
    try {
      setIsCompletingTournament(true);
      
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success('🏆 Giải đấu đã được hoàn thành!');
      // Reload page to update tournament status
      window.location.reload();
    } catch (error: any) {
      console.error('Error completing tournament:', error);
      toast.error(`Lỗi hoàn thành giải đấu: ${error?.message || 'Không xác định'}`);
    } finally {
      setIsCompletingTournament(false);
    }
  };

  // Check if tournament can be completed
  const canCompleteTournament = () => {
    if (matches.length === 0) return false;
    if (tournament.status === 'completed') return false;
    
    // Find final round (highest round number)
    const maxRound = Math.max(...rounds);
    const finalRoundMatches = matchesByRound[maxRound] || [];
    
    // Find final match and third place match
    const finalMatch = finalRoundMatches.find(m => m.notes?.includes('Chung kết') || m.match_number === 1);
    const thirdPlaceMatch = finalRoundMatches.find(m => m.notes?.includes('Tranh hạng 3') || m.is_third_place_match);
    
    if (finalMatch) {
      // Final match must be completed
      const finalCompleted = finalMatch.status === 'completed' && finalMatch.winner_id;
      
      if (thirdPlaceMatch) {
        // If there's a third place match, it must also be completed
        const thirdPlaceCompleted = thirdPlaceMatch.status === 'completed' && thirdPlaceMatch.winner_id;
        return finalCompleted && thirdPlaceCompleted;
      } else {
        // No third place match, only final match needs to be completed
        return finalCompleted;
      }
    } else if (finalRoundMatches.length === 1) {
      // Legacy - single match in final round
      return finalRoundMatches[0]?.status === 'completed' && finalRoundMatches[0]?.winner_id;
    }
    
    return false;
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

  // Debug logging
  console.log('Debug - Tournament matches:', {
    totalMatches: matches.length,
    rounds,
    selectedRound,
    matchesByRound,
    filteredMatches,
    maxRound: Math.max(...rounds),
    finalRoundMatches: rounds.length > 0 ? matchesByRound[Math.max(...rounds)] : []
  });

  // Auto create third place match when semi-finals complete
  const handleCreateThirdPlaceMatch = async () => {
    try {
      const { data, error } = await supabase.rpc('create_third_place_match', {
        p_tournament_id: tournament.id
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast.error(String(data.error));
        return;
      }

      toast.success('Đã tạo trận tranh hạng 3!');
      await refetchMatches();
    } catch (error: any) {
      console.error('Error creating third place match:', error);
      toast.error(`Lỗi tạo trận tranh hạng 3: ${error?.message || 'Không xác định'}`);
    }
  };

  // Check if semi-finals are complete and 3rd place match can be created
  const canCreateThirdPlaceMatch = () => {
    if (matches.length === 0) return false;
    
    const maxRound = Math.max(...rounds);
    const semiRoundMatches = matchesByRound[maxRound - 1] || [];
    const finalRoundMatches = matchesByRound[maxRound] || [];
    
    // Check if all semi-finals are completed
    const semiFinalsComplete = semiRoundMatches.length >= 2 && 
                               semiRoundMatches.every(m => m.status === 'completed' && m.winner_id);
    
    // Check if 3rd place match doesn't already exist
    const thirdPlaceExists = finalRoundMatches.some(m => (m as any).is_third_place_match);
    
    return semiFinalsComplete && !thirdPlaceExists;
  };

  // Get round display name
  const getRoundDisplayName = (roundNumber: number, notes?: string, isThirdPlace?: boolean) => {
    if (isThirdPlace) {
      return 'Tranh hạng 3';
    }
    
    if (notes && (notes.includes('Tranh hạng 3') || notes.includes('Chung kết'))) {
      return notes;
    }
    
    const maxRound = Math.max(...rounds);
    
    if (maxRound >= 4) {
      switch (roundNumber) {
        case 1: return 'Round of 16';
        case maxRound - 2: return 'Tứ kết';
        case maxRound - 1: return 'Bán kết';
        case maxRound: return 'Chung kết';
        default: return `Vòng ${roundNumber}`;
      }
    } else if (maxRound === 3) {
      switch (roundNumber) {
        case 1: return 'Tứ kết';
        case 2: return 'Bán kết';
        case 3: return 'Chung kết';
        default: return `Vòng ${roundNumber}`;
      }
    } else if (maxRound === 2) {
      switch (roundNumber) {
        case 1: return 'Bán kết';
        case 2: return 'Chung kết';
        default: return `Vòng ${roundNumber}`;
      }
    }
    
    return `Vòng ${roundNumber}`;
  };

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

            {/* Create Third Place Match Button */}
            {canCreateThirdPlaceMatch() && (
              <Button
                onClick={handleCreateThirdPlaceMatch}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Trophy className="h-4 w-4" />
                Tạo trận tranh hạng 3
              </Button>
            )}

            {/* Complete Tournament Button */}
            {canCompleteTournament() && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  onClick={handleCompleteTournament}
                  disabled={isCompletingTournament}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="h-4 w-4" />
                  {isCompletingTournament ? 'Đang hoàn thành...' : 'Hoàn thành giải đấu'}
                </Button>
              </>
            )}

            {/* Round Filter Buttons */}
            {rounds.length > 1 && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  onClick={() => setSelectedRound('all')}
                  variant={selectedRound === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  Tất cả vòng
                </Button>
                {rounds.map(round => {
                  const sampleMatch = matchesByRound[round]?.[0];
                  const displayName = getRoundDisplayName(round, sampleMatch?.notes);
                  return (
                    <Button
                      key={round}
                      onClick={() => setSelectedRound(round)}
                      variant={selectedRound === round ? 'default' : 'outline'}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {displayName}
                    </Button>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matches Grid */}
      <div className="space-y-6">
        {/* Group matches by type for final round */}
        {selectedRound !== 'all' && selectedRound && rounds.includes(selectedRound) ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {getRoundDisplayName(selectedRound, matchesByRound[selectedRound]?.[0]?.notes)}
              </h3>
              <Badge variant="outline">
                {filteredMatches.length} trận
              </Badge>
            </div>
            
            {/* Regular matches display */}
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
          </div>
        ) : (
          // Show all matches grouped by round
          <div className="space-y-8">
            {rounds.map(round => {
              const roundMatches = matchesByRound[round] || [];
              if (roundMatches.length === 0) return null;
              
              // For final round, separate regular final from 3rd place match
              if (round === Math.max(...rounds)) {
                const finalMatch = roundMatches.filter(m => !(m as any).is_third_place_match);
                const thirdPlaceMatch = roundMatches.filter(m => (m as any).is_third_place_match);
                
                return (
                  <div key={round} className="space-y-6">
                    {/* Final Match */}
                    {finalMatch.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Chung kết</h3>
                          <Badge variant="outline">
                            {finalMatch.length} trận
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {finalMatch.map(match => (
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
                      </div>
                    )}
                    
                    {/* Third Place Match */}
                    {thirdPlaceMatch.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-orange-600">Tranh hạng 3</h3>
                          <Badge variant="outline" className="bg-orange-50 text-orange-600">
                            {thirdPlaceMatch.length} trận
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {thirdPlaceMatch.map(match => (
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
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <div key={round} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {getRoundDisplayName(round, roundMatches[0]?.notes)}
                    </h3>
                    <Badge variant="outline">
                      {roundMatches.length} trận
                    </Badge>
                  </div>
                  
                  {/* Regular grid display for all rounds */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roundMatches.map(match => (
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
                </div>
              );
            })}
          </div>
        )}

        {filteredMatches.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có trận đấu nào</h3>
              <p className="text-muted-foreground">
                {selectedRound === 'all' 
                  ? 'Giải đấu chưa có trận đấu nào được tạo'
                  : `${getRoundDisplayName(selectedRound as number)} chưa có trận đấu nào`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};