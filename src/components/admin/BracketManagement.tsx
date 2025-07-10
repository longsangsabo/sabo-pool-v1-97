import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Network, Users, Shuffle, RotateCcw, UserPlus, UserMinus, 
  RefreshCw, Settings, Eye, Edit, Trash2, ArrowUpDown 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  full_name: string;
  elo?: number;
  seed_position?: number;
}

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  status: string;
  player1?: Player;
  player2?: Player;
}

interface BracketManagementProps {
  tournamentId: string;
  onBracketUpdate: () => void;
}

const BracketManagement: React.FC<BracketManagementProps> = ({
  tournamentId,
  onBracketUpdate
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [substitutionData, setSubstitutionData] = useState({
    oldPlayerId: '',
    newPlayerId: '',
    reason: ''
  });

  useEffect(() => {
    loadBracketData();
  }, [tournamentId]);

  const loadBracketData = async () => {
    try {
      // Load matches
      const { data: matchData, error: matchError } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(id, full_name, elo),
          player2:profiles!tournament_matches_player2_id_fkey(id, full_name, elo)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (matchError) throw matchError;
      setMatches(matchData || []);

      // Load tournament players from registrations
      const { data: playerData, error: playerError } = await supabase
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (playerError) throw playerError;

      if (playerData && playerData.length > 0) {
        const playerIds = playerData.map(reg => reg.player_id);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, elo')
          .in('user_id', playerIds);

        if (profileError) throw profileError;

        const formattedPlayers = (profileData || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          elo: profile.elo,
          seed_position: undefined
        }));
        setPlayers(formattedPlayers);
      } else {
        setPlayers([]);
      }

    } catch (error) {
      console.error('Error loading bracket data:', error);
      toast.error('Có lỗi khi tải dữ liệu bracket');
    }
  };

  const handlePlayerSubstitution = async () => {
    if (!substitutionData.oldPlayerId || !substitutionData.newPlayerId) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      // Update all matches containing the old player
      const matchesToUpdate = matches.filter(m => 
        m.player1_id === substitutionData.oldPlayerId || 
        m.player2_id === substitutionData.oldPlayerId
      );

      for (const match of matchesToUpdate) {
        const updateData: any = {};
        if (match.player1_id === substitutionData.oldPlayerId) {
          updateData.player1_id = substitutionData.newPlayerId;
        }
        if (match.player2_id === substitutionData.oldPlayerId) {
          updateData.player2_id = substitutionData.newPlayerId;
        }

        await supabase
          .from('tournament_matches')
          .update(updateData)
          .eq('id', match.id);
      }

      // Log the substitution
      await supabase
        .from('match_events')
        .insert({
          match_id: matchesToUpdate[0]?.id,
          event_type: 'player_substitution',
          event_data: {
            old_player_id: substitutionData.oldPlayerId,
            new_player_id: substitutionData.newPlayerId,
            reason: substitutionData.reason,
            affected_matches: matchesToUpdate.length
          },
          reported_by: (await supabase.auth.getUser()).data.user?.id
        });

      toast.success('Đã thay thế người chơi thành công');
      setShowSubstitutionDialog(false);
      setSubstitutionData({ oldPlayerId: '', newPlayerId: '', reason: '' });
      loadBracketData();
      onBracketUpdate();
    } catch (error) {
      console.error('Error substituting player:', error);
      toast.error('Có lỗi khi thay thế người chơi');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBracket = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: tournamentId,
        p_seeding_method: 'elo_ranking',
        p_force_regenerate: true
      });

      if (error) throw error;

      toast.success('Đã tạo lại bracket thành công');
      loadBracketData();
      onBracketUpdate();
    } catch (error) {
      console.error('Error regenerating bracket:', error);
      toast.error('Có lỗi khi tạo lại bracket');
    } finally {
      setIsLoading(false);
    }
  };

  const getBracketStats = () => {
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const inProgressMatches = matches.filter(m => m.status === 'in_progress').length;
    const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

    return {
      totalMatches,
      completedMatches,
      inProgressMatches,
      scheduledMatches,
      completionRate: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
    };
  };

  const stats = getBracketStats();

  return (
    <div className="space-y-6">
      {/* Bracket Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Quản lý Bracket
          </CardTitle>
          <CardDescription>
            Quản lý và chỉnh sửa cấu trúc bracket tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
              <div className="text-sm text-blue-600">Tổng trận đấu</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completedMatches}</div>
              <div className="text-sm text-green-600">Đã hoàn thành</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgressMatches}</div>
              <div className="text-sm text-yellow-600">Đang diễn ra</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.scheduledMatches}</div>
              <div className="text-sm text-gray-600">Chưa bắt đầu</div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Dialog open={showSubstitutionDialog} onOpenChange={setShowSubstitutionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Thay thế người chơi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thay thế người chơi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Người chơi cần thay thế</Label>
                    <Select
                      value={substitutionData.oldPlayerId}
                      onValueChange={(value) => setSubstitutionData({...substitutionData, oldPlayerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người chơi cần thay thế" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.full_name} (Seed: {player.seed_position || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Người chơi thay thế</Label>
                    <Select
                      value={substitutionData.newPlayerId}
                      onValueChange={(value) => setSubstitutionData({...substitutionData, newPlayerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người chơi thay thế" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.filter(p => p.id !== substitutionData.oldPlayerId).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.full_name} (ELO: {player.elo || 'N/A'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Lý do thay thế</Label>
                    <Input
                      id="reason"
                      placeholder="Nhập lý do thay thế..."
                      value={substitutionData.reason}
                      onChange={(e) => setSubstitutionData({...substitutionData, reason: e.target.value})}
                    />
                  </div>

                  <Button 
                    onClick={handlePlayerSubstitution}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Đang xử lý...' : 'Thay thế người chơi'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tạo lại Bracket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận tạo lại Bracket</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ tạo lại toàn bộ bracket dựa trên ELO hiện tại của người chơi. 
                    Tất cả kết quả trận đấu hiện tại sẽ bị mất.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={regenerateBracket} disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu trúc Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from(new Set(matches.map(m => m.round_number))).sort().map(round => (
              <div key={round}>
                <h3 className="font-semibold text-lg mb-3">Vòng {round}</h3>
                <div className="grid gap-3">
                  {matches
                    .filter(m => m.round_number === round)
                    .sort((a, b) => a.match_number - b.match_number)
                    .map(match => (
                      <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium mb-2">
                              Trận {match.match_number}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span>{match.player1?.full_name || 'TBD'}</span>
                                <Badge variant="outline" className="text-xs">
                                  P1
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>{match.player2?.full_name || 'TBD'}</span>
                                <Badge variant="outline" className="text-xs">
                                  P2
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              className={
                                match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {match.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BracketManagement;