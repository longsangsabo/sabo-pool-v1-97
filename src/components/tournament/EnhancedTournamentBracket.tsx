import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Play,
  Check,
  Edit3,
  Eye,
  Zap,
  Clock,
  User,
  Settings,
  Shuffle,
  Target,
  Award,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  rank: string;
  seed?: number;
  spa_points?: number;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  bracket_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  score_player1?: number;
  score_player2?: number;
  winner_id?: string;
  loser_id?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  referee_id?: string;
  match_notes?: string;
  live_stream_url?: string;
  metadata?: any;
  // Player data joined
  player1?: Player;
  player2?: Player;
  winner?: Player;
  referee?: Player;
}

interface TournamentBracket {
  id: string;
  tournament_id: string;
  bracket_type: 'single_elimination' | 'double_elimination' | 'group_stage';
  total_players: number;
  total_rounds: number;
  current_round: number;
  bracket_config?: any;
}

interface EnhancedTournamentBracketProps {
  tournamentId: string;
  isAdmin?: boolean;
  canEditResults?: boolean;
  onMatchUpdate?: (match: TournamentMatch) => void;
}

export const EnhancedTournamentBracket: React.FC<EnhancedTournamentBracketProps> = ({
  tournamentId,
  isAdmin = false,
  canEditResults = false,
  onMatchUpdate
}) => {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [participants, setParticipants] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [viewFormat, setViewFormat] = useState<'rounds' | 'bracket' | 'tree'>('rounds');
  const { toast } = useToast();

  useEffect(() => {
    fetchTournamentData();
    setupRealtimeSubscription();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    setIsLoading(true);
    try {
      // Fetch bracket info
      const { data: bracketData, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') {
        throw bracketError;
      }

      setBracket(bracketData as any);

      // Fetch matches - simplified query first
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) throw matchesError;

      // Get unique user IDs for batch profile fetch
      const userIds = new Set<string>();
      matchesData?.forEach(match => {
        if (match.player1_id) userIds.add(match.player1_id);
        if (match.player2_id) userIds.add(match.player2_id);
        if (match.winner_id) userIds.add(match.winner_id);
        if (match.referee_id) userIds.add(match.referee_id);
      });

      // Fetch profiles for all users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, verified_rank')
        .in('user_id', Array.from(userIds));

      // Create profiles lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Transform matches with profile data
      const transformedMatches = matchesData?.map(match => ({
        ...match,
        status: match.status as 'pending' | 'ongoing' | 'completed' | 'cancelled',
        player1: match.player1_id ? {
          id: match.player1_id,
          username: profilesMap.get(match.player1_id)?.display_name || 'Unknown',
          avatar_url: profilesMap.get(match.player1_id)?.avatar_url,
          rank: profilesMap.get(match.player1_id)?.verified_rank || 'K'
        } : undefined,
        player2: match.player2_id ? {
          id: match.player2_id,
          username: profilesMap.get(match.player2_id)?.display_name || 'Unknown',
          avatar_url: profilesMap.get(match.player2_id)?.avatar_url,
          rank: profilesMap.get(match.player2_id)?.verified_rank || 'K'
        } : undefined,
        winner: match.winner_id ? {
          id: match.winner_id,
          username: profilesMap.get(match.winner_id)?.display_name || 'Unknown',
          avatar_url: profilesMap.get(match.winner_id)?.avatar_url,
          rank: profilesMap.get(match.winner_id)?.verified_rank || 'K'
        } : undefined,
        referee: match.referee_id ? {
          id: match.referee_id,
          username: profilesMap.get(match.referee_id)?.display_name || 'Referee',
          avatar_url: profilesMap.get(match.referee_id)?.avatar_url,
          rank: ''
        } : undefined
      })) || [];

      setMatches(transformedMatches as TournamentMatch[]);

      // Fetch participants first
      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          profiles!tournament_registrations_player_id_fkey(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('seed_number', { ascending: true });

      if (participantsError) throw participantsError;

      // Get unique user IDs from participants
      const participantUserIds = participantsData?.map(p => p.player_id).filter(Boolean) || [];
      
      // Fetch profiles for participants
      const { data: participantProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, verified_rank, elo')
        .in('user_id', participantUserIds);

      // Create participant profiles lookup
      const participantProfilesMap = new Map();
      participantProfiles?.forEach(profile => {
        participantProfilesMap.set(profile.user_id, profile);
      });

      const transformedParticipants = participantsData?.map(p => ({
        id: p.player_id,
        username: participantProfilesMap.get(p.player_id)?.display_name || 'Unknown',
        avatar_url: participantProfilesMap.get(p.player_id)?.avatar_url,
        rank: participantProfilesMap.get(p.player_id)?.verified_rank || 'K',
        seed: p.bracket_position || 0,
        spa_points: participantProfilesMap.get(p.player_id)?.elo || 0
      })) || [];

      setParticipants(transformedParticipants);

    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu giải đấu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('tournament_matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          fetchTournamentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const generateBracket = async () => {
    if (!participants.length) {
      toast({
        title: "Lỗi",
        description: "Không có người tham gia để tạo bracket",
        variant: "destructive"
      });
      return;
    }

    try {
      const participantIds = participants.map(p => p.id);
      
      const { data, error } = await supabase.rpc('generate_single_elimination_bracket', {
        p_tournament_id: tournamentId,
        p_participants: participantIds
      });

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã tạo bracket giải đấu"
      });

      fetchTournamentData();
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo bracket",
        variant: "destructive"
      });
    }
  };

  const updateMatchResult = async (matchId: string, result: {
    score_player1: number;
    score_player2: number;
    winner_id: string;
    status: string;
    match_notes?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          ...result,
          loser_id: result.winner_id === editingMatch?.player1_id 
            ? editingMatch?.player2_id 
            : editingMatch?.player1_id,
          actual_end_time: result.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật kết quả trận đấu"
      });

      setEditingMatch(null);
      fetchTournamentData();
    } catch (error) {
      console.error('Error updating match result:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật kết quả",
        variant: "destructive"
      });
    }
  };

  const startMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'ongoing',
          actual_start_time: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã bắt đầu trận đấu"
      });
    } catch (error) {
      console.error('Error starting match:', error);
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu trận đấu",
        variant: "destructive"
      });
    }
  };

  const getRoundName = (round: number) => {
    if (!bracket) return `Vòng ${round}`;
    
    const totalRounds = bracket.total_rounds;
    switch (totalRounds - round + 1) {
      case 1:
        return 'Chung kết';
      case 2:
        return 'Bán kết';
      case 3:
        return 'Tứ kết';
      case 4:
        return 'Vòng 1/8';
      case 5:
        return 'Vòng 1/16';
      default:
        return `Vòng ${round}`;
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getMatchStatusName = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'pending':
        return 'Chờ đấu';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getWinnerStyle = (playerId: string, winnerId?: string) => {
    if (!winnerId) return 'border-border';
    return playerId === winnerId
      ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50';
  };

  const rounds = bracket ? Array.from({ length: bracket.total_rounds }, (_, i) => i + 1) : [];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header & Controls */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Bracket Giải Đấu</h2>
          {bracket && (
            <p className='text-muted-foreground'>
              {bracket.bracket_type === 'single_elimination' ? 'Loại trực tiếp' : bracket.bracket_type} • 
              {bracket.total_players} người chơi • {bracket.total_rounds} vòng
            </p>
          )}
        </div>

        <div className='flex flex-wrap gap-2'>
          {/* View Format Selector */}
          <Select value={viewFormat} onValueChange={(value: any) => setViewFormat(value)}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='rounds'>Theo vòng</SelectItem>
              <SelectItem value='bracket'>Bracket</SelectItem>
              <SelectItem value='tree'>Cây đấu</SelectItem>
            </SelectContent>
          </Select>

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <Button
                variant='outline'
                onClick={generateBracket}
                disabled={matches.length > 0}
              >
                <Shuffle className='h-4 w-4 mr-2' />
                Tạo Bracket
              </Button>
              <Button variant='outline'>
                <Settings className='h-4 w-4 mr-2' />
                Cài đặt
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {bracket && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm text-muted-foreground'>Người chơi</div>
                <div className='text-lg font-semibold'>{bracket.total_players}</div>
              </div>
            </div>
          </Card>
          
          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm text-muted-foreground'>Vòng hiện tại</div>
                <div className='text-lg font-semibold'>{bracket.current_round}/{bracket.total_rounds}</div>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Check className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm text-muted-foreground'>Hoàn thành</div>
                <div className='text-lg font-semibold'>
                  {matches.filter(m => m.status === 'completed').length}/{matches.length}
                </div>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Play className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm text-muted-foreground'>Đang diễn ra</div>
                <div className='text-lg font-semibold'>
                  {matches.filter(m => m.status === 'ongoing').length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {matches.length === 0 ? (
        <Card className='p-12 text-center'>
          <Trophy className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <h3 className='text-lg font-semibold mb-2'>Chưa có bracket</h3>
          <p className='text-muted-foreground mb-4'>
            {participants.length > 0 
              ? 'Nhấn "Tạo Bracket" để bắt đầu giải đấu'
              : 'Cần có người tham gia trước khi tạo bracket'
            }
          </p>
          {isAdmin && participants.length > 0 && (
            <Button onClick={generateBracket}>
              <Shuffle className='h-4 w-4 mr-2' />
              Tạo Bracket
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Round Navigation */}
          <div className='flex items-center gap-2 overflow-x-auto pb-2'>
            {rounds.map(round => (
              <Button
                key={round}
                variant={selectedRound === round ? 'default' : 'outline'}
                onClick={() => setSelectedRound(round)}
                className='whitespace-nowrap flex-shrink-0'
              >
                {getRoundName(round)}
              </Button>
            ))}
          </div>

          {/* Matches Display */}
          <div className='space-y-4'>
            {matches
              .filter(match => match.round_number === selectedRound)
              .map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  canEdit={canEditResults || isAdmin}
                  onEdit={() => setEditingMatch(match)}
                  onStart={() => startMatch(match.id)}
                  getMatchStatusColor={getMatchStatusColor}
                  getMatchStatusName={getMatchStatusName}
                  getWinnerStyle={getWinnerStyle}
                />
              ))}
          </div>
        </>
      )}

      {/* Match Edit Dialog */}
      {editingMatch && (
        <MatchEditDialog
          match={editingMatch}
          open={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={updateMatchResult}
        />
      )}
    </div>
  );
};

// Match Card Component
const MatchCard: React.FC<{
  match: TournamentMatch;
  canEdit: boolean;
  onEdit: () => void;
  onStart: () => void;
  getMatchStatusColor: (status: string) => string;
  getMatchStatusName: (status: string) => string;
  getWinnerStyle: (playerId: string, winnerId?: string) => string;
}> = ({ match, canEdit, onEdit, onStart, getMatchStatusColor, getMatchStatusName, getWinnerStyle }) => {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      match.status === 'ongoing' ? 'ring-2 ring-primary' : ''
    }`}>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Badge className={getMatchStatusColor(match.status)}>
              {getMatchStatusName(match.status)}
            </Badge>
            <span className='text-sm text-muted-foreground'>
              Trận {match.match_number}
            </span>
            {match.live_stream_url && (
              <Badge variant='outline' className='text-red-500 border-red-500'>
                <Zap className='h-3 w-3 mr-1' />
                LIVE
              </Badge>
            )}
          </div>

          {match.scheduled_time && (
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <Clock className='h-3 w-3' />
              {new Date(match.scheduled_time).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        <div className='space-y-2'>
          {/* Player 1 */}
          <PlayerRow
            player={match.player1}
            score={match.score_player1}
            isWinner={match.winner_id === match.player1_id}
            style={getWinnerStyle(match.player1_id || '', match.winner_id)}
          />

          {/* VS */}
          <div className='text-center py-2'>
            <div className='text-sm font-bold text-muted-foreground'>VS</div>
          </div>

          {/* Player 2 */}
          <PlayerRow
            player={match.player2}
            score={match.score_player2}
            isWinner={match.winner_id === match.player2_id}
            style={getWinnerStyle(match.player2_id || '', match.winner_id)}
          />
        </div>

        {/* Match Actions */}
        <div className='flex gap-2 mt-4 pt-3 border-t'>
          {match.status === 'pending' && match.player1 && match.player2 && canEdit && (
            <Button size='sm' onClick={onStart} className='flex-1'>
              <Play className='h-4 w-4 mr-2' />
              Bắt đầu
            </Button>
          )}
          
          {match.status === 'ongoing' && (
            <>
              {match.live_stream_url && (
                <Button size='sm' variant='outline' asChild>
                  <a href={match.live_stream_url} target='_blank' rel='noopener noreferrer'>
                    <Eye className='h-4 w-4 mr-2' />
                    Xem Live
                  </a>
                </Button>
              )}
              {canEdit && (
                <Button size='sm' onClick={onEdit}>
                  <Edit3 className='h-4 w-4 mr-2' />
                  Cập nhật
                </Button>
              )}
            </>
          )}

          {match.status === 'completed' && match.winner && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Award className='h-4 w-4' />
              Người thắng: {match.winner.username}
            </div>
          )}
        </div>

        {match.match_notes && (
          <Alert className='mt-3'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{match.match_notes}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Player Row Component
const PlayerRow: React.FC<{
  player?: Player;
  score?: number;
  isWinner: boolean;
  style: string;
}> = ({ player, score, isWinner, style }) => {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${style}`}>
      <div className='flex items-center gap-3'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={player?.avatar_url} />
          <AvatarFallback>
            {player?.username?.[0] || 'T'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className='font-medium'>
            {player?.username || 'TBD'}
          </div>
          <div className='text-sm text-muted-foreground'>
            {player?.rank && `Hạng ${player.rank}`}
            {player?.seed && ` (#${player.seed})`}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {score !== undefined && (
          <span className='text-lg font-bold'>
            {score}
          </span>
        )}
        {isWinner && (
          <Check className='h-5 w-5 text-green-600' />
        )}
      </div>
    </div>
  );
};

// Match Edit Dialog Component
const MatchEditDialog: React.FC<{
  match: TournamentMatch;
  open: boolean;
  onClose: () => void;
  onSave: (matchId: string, result: any) => void;
}> = ({ match, open, onClose, onSave }) => {
  const [score1, setScore1] = useState(match.score_player1 || 0);
  const [score2, setScore2] = useState(match.score_player2 || 0);
  const [notes, setNotes] = useState(match.match_notes || '');
  const [status, setStatus] = useState(match.status);

  const handleSave = () => {
    const winnerId = score1 > score2 ? match.player1_id : match.player2_id;
    
    onSave(match.id, {
      score_player1: score1,
      score_player2: score2,
      winner_id: winnerId,
      status: status === 'ongoing' && score1 !== score2 ? 'completed' : status,
      match_notes: notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Cập nhật kết quả trận đấu</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Match Info */}
          <div className='text-center p-4 bg-muted rounded-lg'>
            <div className='font-medium'>
              {match.player1?.username} vs {match.player2?.username}
            </div>
            <div className='text-sm text-muted-foreground'>
              Trận {match.match_number}
            </div>
          </div>

          {/* Scores */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>{match.player1?.username}</label>
              <Input
                type='number'
                value={score1}
                onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                className='mt-1'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>{match.player2?.username}</label>
              <Input
                type='number'
                value={score2}
                onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                className='mt-1'
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className='text-sm font-medium'>Trạng thái</label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className='mt-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='pending'>Chờ đấu</SelectItem>
                <SelectItem value='ongoing'>Đang diễn ra</SelectItem>
                <SelectItem value='completed'>Hoàn thành</SelectItem>
                <SelectItem value='cancelled'>Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className='text-sm font-medium'>Ghi chú</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Thêm ghi chú về trận đấu...'
              className='mt-1'
            />
          </div>

          {/* Actions */}
          <div className='flex gap-2 pt-4'>
            <Button onClick={handleSave} className='flex-1'>
              <Save className='h-4 w-4 mr-2' />
              Lưu
            </Button>
            <Button variant='outline' onClick={onClose}>
              <X className='h-4 w-4 mr-2' />
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};