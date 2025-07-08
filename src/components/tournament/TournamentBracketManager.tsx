import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Users, 
  Play, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BracketGenerator } from './BracketGenerator';
import { TournamentBracketViewer } from './TournamentBracketViewer';

interface TournamentBracketManagerProps {
  tournamentId: string;
  canManage?: boolean;
}

interface BracketStatus {
  tournament_id: string;
  bracket_exists: boolean;
  bracket_type: string;
  total_players: number;
  total_rounds: number;
  current_round: number;
  status: string;
  matches_summary: {
    total_matches: number;
    completed_matches: number;
    ongoing_matches: number;
    scheduled_matches: number;
    by_round: Record<string, {
      total: number;
      completed: number;
      status: string;
    }>;
  };
}

export const TournamentBracketManager: React.FC<TournamentBracketManagerProps> = ({
  tournamentId,
  canManage = false
}) => {
  const [bracketStatus, setBracketStatus] = useState<BracketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBracketStatus();
  }, [tournamentId]);

  const loadBracketStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_tournament_bracket_status', {
        p_tournament_id: tournamentId
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        // No bracket exists yet
        setBracketStatus(null);
      } else if (data) {
        setBracketStatus(data as unknown as BracketStatus);
      }
    } catch (error) {
      console.error('Error loading bracket status:', error);
      setBracketStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBracketGenerated = () => {
    loadBracketStatus();
    toast.success('Bảng đấu đã được tạo thành công!');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Đang tải trạng thái bảng đấu...</span>
        </CardContent>
      </Card>
    );
  }

  if (!bracketStatus) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Quản lý Bảng Đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Bảng đấu chưa được tạo. Sử dụng công cụ tạo bảng đấu bên dưới để bắt đầu.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {canManage && (
          <BracketGenerator 
            tournamentId={tournamentId}
            onBracketGenerated={handleBracketGenerated}
          />
        )}
      </div>
    );
  }

  const progressPercentage = bracketStatus.matches_summary.total_matches > 0 
    ? (bracketStatus.matches_summary.completed_matches / bracketStatus.matches_summary.total_matches) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Bracket Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tình trạng Bảng Đấu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{bracketStatus.total_players}</div>
              <div className="text-sm text-muted-foreground">Người chơi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{bracketStatus.total_rounds}</div>
              <div className="text-sm text-muted-foreground">Vòng đấu</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bracketStatus.matches_summary.completed_matches}</div>
              <div className="text-sm text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{bracketStatus.matches_summary.scheduled_matches}</div>
              <div className="text-sm text-muted-foreground">Chờ đấu</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ giải đấu</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Round Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-medium">
                {bracketStatus.current_round <= bracketStatus.total_rounds 
                  ? `Vòng ${bracketStatus.current_round}` 
                  : 'Giải đấu hoàn thành'}
              </span>
            </div>
            <Badge variant={
              bracketStatus.current_round <= bracketStatus.total_rounds ? 'default' : 'secondary'
            }>
              {bracketStatus.status === 'completed' ? 'Hoàn thành' : 'Đang diễn ra'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="bracket">Bảng đấu</TabsTrigger>
          {canManage && <TabsTrigger value="management">Quản lý</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Chi tiết từng vòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(bracketStatus.matches_summary.by_round)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([round, stats]) => (
                    <div key={round} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-12 justify-center">
                          R{round}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {Number(round) === bracketStatus.total_rounds ? 'Chung kết' : 
                             Number(round) === bracketStatus.total_rounds - 1 ? 'Bán kết' :
                             Number(round) === bracketStatus.total_rounds - 2 ? 'Tứ kết' :
                             `Vòng ${round}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stats.completed}/{stats.total} trận đấu
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          stats.status === 'completed' ? 'default' :
                          stats.status === 'ongoing' ? 'secondary' : 'outline'
                        }>
                          {stats.status === 'completed' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Hoàn thành
                            </>
                          ) : stats.status === 'ongoing' ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Đang diễn ra
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Chờ đấu
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bracket">
          <TournamentBracketViewer 
            tournamentId={tournamentId}
            canManage={canManage}
          />
        </TabsContent>

        {canManage && (
          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Công cụ quản lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BracketGenerator 
                  tournamentId={tournamentId}
                  onBracketGenerated={handleBracketGenerated}
                />
                
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Các thao tác quản lý bảng đấu:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Tạo lại bảng đấu với thuật toán khác</li>
                        <li>Sắp xếp lại thứ tự thi đấu</li>
                        <li>Theo dõi tiến độ từng vòng đấu</li>
                        <li>Quản lý kết quả trận đấu</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TournamentBracketManager;