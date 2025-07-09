import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Award,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTournamentManagement } from '@/hooks/useTournamentManagement';
import { toast } from 'sonner';

interface TournamentLifecycleStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  canProgress: boolean;
  actions: string[];
  progress: number;
}

interface TournamentStats {
  totalParticipants: number;
  confirmedParticipants: number;
  completedMatches: number;
  totalMatches: number;
  prizePool: number;
  checkedInPlayers: number;
}

const TournamentLifecycleManager = ({ tournamentId }: { tournamentId: string }) => {
  const { user } = useAuth();
  const { tournament, workflowSteps, realtimeStats, loading, updateManagementStatus } = useTournamentManagement(tournamentId);
  const [lifecycleStages, setLifecycleStages] = useState<TournamentLifecycleStage[]>([]);
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null);
  const [activeStage, setActiveStage] = useState<string>('');

  useEffect(() => {
    if (tournament) {
      generateLifecycleStages();
      fetchTournamentStats();
    }
  }, [tournament, realtimeStats]);

  const generateLifecycleStages = () => {
    const now = new Date();
    const registrationStart = new Date(tournament.registration_start);
    const registrationEnd = new Date(tournament.registration_end);
    const tournamentStart = new Date(tournament.tournament_start);
    const tournamentEnd = new Date(tournament.tournament_end);

    const stages: TournamentLifecycleStage[] = [
      {
        id: 'setup',
        name: 'Thiết lập giải đấu',
        description: 'Cấu hình thông tin cơ bản, luật chơi, giải thưởng',
        status: tournament.status === 'draft' ? 'active' : 'completed',
        canProgress: tournament.status === 'draft',
        actions: ['edit_info', 'set_rules', 'configure_prizes'],
        progress: tournament.status === 'draft' ? 75 : 100
      },
      {
        id: 'registration',
        name: 'Đăng ký tham gia',
        description: 'Mở đăng ký và thu thập thông tin người chơi',
        status: now >= registrationStart && now <= registrationEnd ? 'active' : 
                now < registrationStart ? 'pending' : 'completed',
        canProgress: now >= registrationEnd && tournament.current_participants >= 2,
        actions: ['manage_registrations', 'verify_players', 'collect_fees'],
        progress: tournament.current_participants / tournament.max_participants * 100
      },
      {
        id: 'preparation',
        name: 'Chuẩn bị thi đấu',
        description: 'Tạo bracket, phân bổ bàn đấu, check-in người chơi',
        status: tournament.status === 'registration_closed' ? 'active' : 
                tournament.status === 'preparation' ? 'active' : 
                now > registrationEnd && now < tournamentStart ? 'active' : 'pending',
        canProgress: realtimeStats?.bracket_generated && realtimeStats?.checked_in_participants >= tournament.current_participants * 0.8,
        actions: ['generate_bracket', 'assign_tables', 'player_checkin'],
        progress: realtimeStats?.bracket_generated ? 100 : 0
      },
      {
        id: 'competition',
        name: 'Thi đấu',
        description: 'Tiến hành các trận đấu theo bracket',
        status: tournament.status === 'ongoing' ? 'active' : 
                now >= tournamentStart && now <= tournamentEnd ? 'active' : 'pending',
        canProgress: realtimeStats?.completed_matches === realtimeStats?.total_matches,
        actions: ['manage_matches', 'update_scores', 'resolve_disputes'],
        progress: realtimeStats?.total_matches ? 
          (realtimeStats.completed_matches / realtimeStats.total_matches) * 100 : 0
      },
      {
        id: 'conclusion',
        name: 'Kết thúc giải đấu',
        description: 'Xác định kết quả, trao giải, cập nhật ranking',
        status: tournament.status === 'completed' ? 'completed' : 'pending',
        canProgress: tournament.status === 'ongoing',
        actions: ['determine_winners', 'distribute_prizes', 'update_rankings'],
        progress: tournament.status === 'completed' ? 100 : 0
      }
    ];

    // Find current active stage
    const currentStage = stages.find(stage => stage.status === 'active');
    setActiveStage(currentStage?.id || '');
    
    setLifecycleStages(stages);
  };

  const fetchTournamentStats = async () => {
    try {
      // Get registration stats
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (regError) throw regError;

      // Get match stats
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (matchError) throw matchError;

      const stats: TournamentStats = {
        totalParticipants: registrations?.length || 0,
        confirmedParticipants: registrations?.filter(r => r.status === 'confirmed').length || 0,
        completedMatches: matches?.filter(m => m.status === 'completed').length || 0,
        totalMatches: matches?.length || 0,
        prizePool: tournament.entry_fee * (registrations?.length || 0),
        checkedInPlayers: realtimeStats?.checked_in_participants || 0
      };

      setTournamentStats(stats);
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
    }
  };

  const progressToNextStage = async (stageId: string) => {
    try {
      let newStatus = '';
      
      switch (stageId) {
        case 'setup':
          newStatus = 'registration_open';
          break;
        case 'registration':
          newStatus = 'registration_closed';
          break;
        case 'preparation':
          newStatus = 'ongoing';
          break;
        case 'competition':
          newStatus = 'completed';
          break;
        default:
          return;
      }

      await updateManagementStatus(newStatus);
      toast.success(`Đã chuyển sang giai đoạn tiếp theo`);
    } catch (error) {
      console.error('Error progressing stage:', error);
      toast.error('Lỗi khi chuyển giai đoạn');
    }
  };

  const executeAction = async (action: string) => {
    try {
      switch (action) {
        case 'generate_bracket':
          const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
            p_tournament_id: tournamentId,
            p_seeding_method: 'elo_ranking'
          });
          
          if (error) throw error;
          toast.success('Đã tạo bracket thành công');
          break;
          
        case 'player_checkin':
          // Open check-in for all registered players
          await supabase
            .from('tournament_registrations')
            .update({ status: 'checked_in' })
            .eq('tournament_id', tournamentId)
            .eq('registration_status', 'confirmed');
          
          toast.success('Đã mở check-in cho người chơi');
          break;
          
        default:
          toast.info(`Chức năng ${action} đang được phát triển`);
      }
      
      await fetchTournamentStats();
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Lỗi khi thực hiện hành động');
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'active':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading || !tournament) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Quản lý vòng đời giải đấu: {tournament.name}
          </CardTitle>
          <CardDescription>
            Theo dõi và quản lý tất cả các giai đoạn của giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lifecycle" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lifecycle">Vòng đời</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            <TabsContent value="lifecycle" className="space-y-6">
              {/* Tournament Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{tournament.current_participants}/{tournament.max_participants}</p>
                  <p className="text-sm text-muted-foreground">Người chơi</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{new Date(tournament.tournament_start).toLocaleDateString('vi-VN')}</p>
                  <p className="text-sm text-muted-foreground">Ngày thi đấu</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{tournament.entry_fee?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Phí tham gia</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Award className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{tournamentStats?.prizePool?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Tổng giải thưởng</p>
                </div>
              </div>

              {/* Lifecycle Stages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Các giai đoạn giải đấu</h3>
                <div className="space-y-4">
                  {lifecycleStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className={`p-4 border rounded-lg ${getStageColor(stage.status)} ${
                        stage.id === activeStage ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStageIcon(stage.status)}
                          <div>
                            <h4 className="font-medium">{stage.name}</h4>
                            <p className="text-sm text-muted-foreground">{stage.description}</p>
                          </div>
                        </div>
                        <Badge variant={stage.status === 'active' ? 'default' : 'secondary'}>
                          {stage.status === 'pending' && 'Chờ'}
                          {stage.status === 'active' && 'Đang diễn ra'}
                          {stage.status === 'completed' && 'Hoàn thành'}
                          {stage.status === 'failed' && 'Thất bại'}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Tiến độ</span>
                          <span>{Math.round(stage.progress)}%</span>
                        </div>
                        <Progress value={stage.progress} className="h-2" />
                      </div>

                      {/* Actions */}
                      {stage.status === 'active' && stage.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {stage.actions.map((action) => (
                            <Button
                              key={action}
                              size="sm"
                              variant="outline"
                              onClick={() => executeAction(action)}
                            >
                              {action === 'generate_bracket' && 'Tạo Bracket'}
                              {action === 'player_checkin' && 'Mở Check-in'}
                              {action === 'manage_matches' && 'Quản lý trận đấu'}
                              {action === 'edit_info' && 'Chỉnh sửa thông tin'}
                              {action === 'set_rules' && 'Thiết lập luật chơi'}
                              {action === 'configure_prizes' && 'Cấu hình giải thưởng'}
                              {action === 'manage_registrations' && 'Quản lý đăng ký'}
                              {action === 'verify_players' && 'Xác minh người chơi'}
                              {action === 'collect_fees' && 'Thu phí tham gia'}
                              {action === 'assign_tables' && 'Phân bổ bàn đấu'}
                              {action === 'update_scores' && 'Cập nhật tỷ số'}
                              {action === 'resolve_disputes' && 'Giải quyết tranh chấp'}
                              {action === 'determine_winners' && 'Xác định người thắng'}
                              {action === 'distribute_prizes' && 'Trao giải thưởng'}
                              {action === 'update_rankings' && 'Cập nhật ranking'}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Progress to Next Stage */}
                      {stage.canProgress && stage.status === 'active' && (
                        <Button
                          onClick={() => progressToNextStage(stage.id)}
                          className="w-full"
                        >
                          Chuyển sang giai đoạn tiếp theo
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {tournamentStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thống kê người chơi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Tổng đăng ký:</span>
                          <span className="font-semibold">{tournamentStats.totalParticipants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Đã xác nhận:</span>
                          <span className="font-semibold">{tournamentStats.confirmedParticipants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Đã check-in:</span>
                          <span className="font-semibold">{tournamentStats.checkedInPlayers}</span>
                        </div>
                        <Progress 
                          value={(tournamentStats.confirmedParticipants / tournament.max_participants) * 100} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thống kê trận đấu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Trận đã hoàn thành:</span>
                          <span className="font-semibold">{tournamentStats.completedMatches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tổng số trận:</span>
                          <span className="font-semibold">{tournamentStats.totalMatches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tiến độ:</span>
                          <span className="font-semibold">
                            {tournamentStats.totalMatches > 0 
                              ? Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)
                              : 0
                            }%
                          </span>
                        </div>
                        <Progress 
                          value={tournamentStats.totalMatches > 0 
                            ? (tournamentStats.completedMatches / tournamentStats.totalMatches) * 100 
                            : 0
                          } 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Workflow Steps</h3>
                {workflowSteps.map((step) => (
                  <div key={step.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{step.step_name}</h4>
                        <p className="text-sm text-muted-foreground">Bước {step.step_number}</p>
                      </div>
                      <Badge variant={step.step_status === 'completed' ? 'default' : 'secondary'}>
                        {step.step_status}
                      </Badge>
                    </div>
                    {step.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{step.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentLifecycleManager;