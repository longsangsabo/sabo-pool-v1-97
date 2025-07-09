import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Sword, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Target,
  Timer,
  Award,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChallengeWorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'expired';
  description: string;
  timeLimit?: number; // in minutes
  completedAt?: string;
}

interface ChallengeData {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  status: string;
  message: string | null;
  bet_points: number;
  race_to: number;
  scheduled_time: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  challenger?: any;
  opponent?: any;
}

const ChallengeWorkflowManager = () => {
  const { user } = useAuth();
  const { challenges, completeChallengeEnhanced, dailyStats, canCreateChallenge, getRemainingChallenges } = useEnhancedChallenges();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeData | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<ChallengeWorkflowStep[]>([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [matchResult, setMatchResult] = useState({
    winnerId: '',
    loserId: '',
    winnerScore: 0,
    loserScore: 0,
    notes: ''
  });

  useEffect(() => {
    if (selectedChallenge) {
      generateWorkflowSteps(selectedChallenge);
    }
  }, [selectedChallenge]);

  const generateWorkflowSteps = (challenge: ChallengeData) => {
    const now = new Date();
    const expiresAt = new Date(challenge.expires_at);
    const scheduledTime = challenge.scheduled_time ? new Date(challenge.scheduled_time) : null;

    const steps: ChallengeWorkflowStep[] = [
      {
        id: 'creation',
        name: 'Tạo thách đấu',
        status: 'completed',
        description: 'Thách đấu đã được tạo bởi người thách đấu',
        completedAt: challenge.created_at
      },
      {
        id: 'notification',
        name: 'Thông báo đối thủ',
        status: challenge.opponent_id ? 'completed' : 'pending',
        description: 'Gửi thông báo đến đối thủ được chỉ định',
        timeLimit: 30
      },
      {
        id: 'response',
        name: 'Phản hồi đối thủ',
        status: challenge.status === 'accepted' ? 'completed' : 
                challenge.status === 'declined' ? 'failed' :
                now > expiresAt ? 'expired' : 'pending',
        description: 'Đối thủ chấp nhận hoặc từ chối thách đấu',
        timeLimit: 2880 // 48 hours
      },
      {
        id: 'scheduling',
        name: 'Lên lịch thi đấu',
        status: scheduledTime ? 'completed' : 
                challenge.status === 'accepted' ? 'active' : 'pending',
        description: 'Thỏa thuận thời gian và địa điểm thi đấu',
        timeLimit: 1440 // 24 hours
      },
      {
        id: 'match',
        name: 'Tiến hành trận đấu',
        status: challenge.status === 'completed' ? 'completed' :
                challenge.status === 'in_progress' ? 'active' :
                scheduledTime && now >= scheduledTime ? 'active' : 'pending',
        description: 'Thực hiện trận đấu và ghi nhận kết quả',
        timeLimit: 180 // 3 hours
      },
      {
        id: 'verification',
        name: 'Xác minh kết quả',
        status: challenge.status === 'completed' ? 'completed' : 'pending',
        description: 'Xác nhận kết quả từ cả hai người chơi',
        timeLimit: 60 // 1 hour
      },
      {
        id: 'spa_calculation',
        name: 'Tính toán SPA',
        status: challenge.status === 'completed' ? 'completed' : 'pending',
        description: 'Tính toán và cộng điểm SPA cho người thắng',
        timeLimit: 5
      }
    ];

    setWorkflowSteps(steps);
  };

  const respondToChallenge = async (challengeId: string, response: 'accept' | 'decline') => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: response === 'accept' ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
          response_message: responseMessage || null
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success(response === 'accept' ? 'Đã chấp nhận thách đấu' : 'Đã từ chối thách đấu');
      
      // Update the selected challenge
      if (selectedChallenge) {
        setSelectedChallenge({
          ...selectedChallenge,
          status: response === 'accept' ? 'accepted' : 'declined',
          responded_at: new Date().toISOString()
        });
      }
      
      setResponseMessage('');
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast.error('Lỗi khi phản hồi thách đấu');
    }
  };

  const startMatch = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Đã bắt đầu trận đấu');
      
      if (selectedChallenge) {
        setSelectedChallenge({
          ...selectedChallenge,
          status: 'in_progress'
        });
      }
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Lỗi khi bắt đầu trận đấu');
    }
  };

  const completeChallenge = async () => {
    if (!selectedChallenge || !matchResult.winnerId || !matchResult.loserId) {
      toast.error('Vui lòng nhập đầy đủ thông tin kết quả');
      return;
    }

    try {
      await completeChallengeEnhanced({
        challengeId: selectedChallenge.id,
        winnerId: matchResult.winnerId,
        loserId: matchResult.loserId,
        winnerScore: matchResult.winnerScore,
        loserScore: matchResult.loserScore,
        notes: matchResult.notes
      });

      if (selectedChallenge) {
        setSelectedChallenge({
          ...selectedChallenge,
          status: 'completed'
        });
      }

      // Reset match result form
      setMatchResult({
        winnerId: '',
        loserId: '',
        winnerScore: 0,
        loserScore: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const createNewChallenge = async (opponentId: string, message: string, betPoints: number = 0) => {
    if (!canCreateChallenge()) {
      toast.error(`Bạn đã hết lượt thách đấu hôm nay. Còn lại: ${getRemainingChallenges()} lượt`);
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours from now

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user?.id,
          opponent_id: opponentId,
          message,
          bet_points: betPoints,
          race_to: 5,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Đã tạo thách đấu thành công');
      return data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Lỗi khi tạo thách đấu');
    }
  };

  const getStepIcon = (status: ChallengeWorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Timer className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: ChallengeWorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'expired':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTimeRemaining = (challenge: ChallengeData) => {
    const now = new Date();
    const expiresAt = new Date(challenge.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Quản lý quy trình thách đấu
          </CardTitle>
          <CardDescription>
            Theo dõi và quản lý toàn bộ vòng đời của các thách đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Daily Challenge Stats */}
          {dailyStats && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">Thống kê hôm nay</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{dailyStats.count}</p>
                  <p className="text-sm text-muted-foreground">Đã thách đấu</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{getRemainingChallenges()}</p>
                  <p className="text-sm text-muted-foreground">Còn lại</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">2</p>
                  <p className="text-sm text-muted-foreground">Giới hạn/ngày</p>
                </div>
              </div>
              <Progress 
                value={(dailyStats.count / 2) * 100} 
                className="mt-3"
              />
            </div>
          )}

          {/* Challenge List */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold">Danh sách thách đấu</h3>
            <div className="grid gap-4">
              {challenges?.map((challenge: any) => (
                <div
                  key={challenge.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedChallenge?.id === challenge.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedChallenge(challenge)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sword className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">
                          {challenge.challenger?.full_name || 'Unknown'} vs{' '}
                          {challenge.opponent?.full_name || 'Open Challenge'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Race to {challenge.race_to} • {challenge.bet_points} SPA điểm
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        challenge.status === 'completed' ? 'default' :
                        challenge.status === 'accepted' ? 'secondary' :
                        challenge.status === 'declined' ? 'destructive' :
                        'outline'
                      }>
                        {challenge.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getTimeRemaining(challenge)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Details */}
          {selectedChallenge && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chi tiết quy trình</h3>
                <Badge variant="outline">
                  {selectedChallenge.status}
                </Badge>
              </div>

              {/* Challenge Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p><strong>Người thách đấu:</strong> {selectedChallenge.challenger?.full_name}</p>
                  <p><strong>Đối thủ:</strong> {selectedChallenge.opponent?.full_name || 'Chưa chỉ định'}</p>
                  <p><strong>Điểm cược:</strong> {selectedChallenge.bet_points} SPA</p>
                </div>
                <div>
                  <p><strong>Tỷ số mục tiêu:</strong> {selectedChallenge.race_to}</p>
                  <p><strong>Thời gian tạo:</strong> {new Date(selectedChallenge.created_at).toLocaleString('vi-VN')}</p>
                  <p><strong>Hết hạn:</strong> {new Date(selectedChallenge.expires_at).toLocaleString('vi-VN')}</p>
                </div>
                {selectedChallenge.message && (
                  <div className="md:col-span-2">
                    <p><strong>Lời nhắn:</strong> {selectedChallenge.message}</p>
                  </div>
                )}
              </div>

              {/* Workflow Steps */}
              <div className="space-y-3">
                <h4 className="font-medium">Các bước quy trình</h4>
                <div className="space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-4 border rounded-lg ${getStepColor(step.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStepIcon(step.status)}
                          <div>
                            <h5 className="font-medium">{step.name}</h5>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {step.timeLimit && step.status === 'active' && (
                              <p className="text-xs text-orange-600">
                                Thời gian giới hạn: {step.timeLimit} phút
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={
                          step.status === 'completed' ? 'default' :
                          step.status === 'active' ? 'secondary' :
                          step.status === 'failed' ? 'destructive' :
                          step.status === 'expired' ? 'outline' : 'outline'
                        }>
                          {step.status === 'pending' && 'Chờ'}
                          {step.status === 'active' && 'Đang tiến hành'}
                          {step.status === 'completed' && 'Hoàn thành'}
                          {step.status === 'failed' && 'Thất bại'}
                          {step.status === 'expired' && 'Quá hạn'}
                        </Badge>
                      </div>

                      {/* Step Actions */}
                      {step.id === 'response' && step.status === 'pending' && selectedChallenge.opponent_id === user?.id && (
                        <div className="mt-4 space-y-3">
                          <Textarea
                            placeholder="Tin nhắn phản hồi (tùy chọn)..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => respondToChallenge(selectedChallenge.id, 'accept')}
                              className="flex-1"
                            >
                              Chấp nhận
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => respondToChallenge(selectedChallenge.id, 'decline')}
                              className="flex-1"
                            >
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      )}

                      {step.id === 'match' && step.status === 'active' && selectedChallenge.status === 'accepted' && (
                        <div className="mt-4">
                          <Button
                            onClick={() => startMatch(selectedChallenge.id)}
                            className="w-full"
                          >
                            Bắt đầu trận đấu
                          </Button>
                        </div>
                      )}

                      {step.id === 'verification' && selectedChallenge.status === 'in_progress' && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Người thắng</label>
                              <select
                                value={matchResult.winnerId}
                                onChange={(e) => setMatchResult(prev => ({ ...prev, winnerId: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="">Chọn người thắng</option>
                                <option value={selectedChallenge.challenger_id}>
                                  {selectedChallenge.challenger?.full_name}
                                </option>
                                <option value={selectedChallenge.opponent_id}>
                                  {selectedChallenge.opponent?.full_name}
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Người thua</label>
                              <select
                                value={matchResult.loserId}
                                onChange={(e) => setMatchResult(prev => ({ ...prev, loserId: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="">Chọn người thua</option>
                                <option value={selectedChallenge.challenger_id}>
                                  {selectedChallenge.challenger?.full_name}
                                </option>
                                <option value={selectedChallenge.opponent_id}>
                                  {selectedChallenge.opponent?.full_name}
                                </option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              placeholder="Tỷ số người thắng"
                              value={matchResult.winnerScore}
                              onChange={(e) => setMatchResult(prev => ({ ...prev, winnerScore: parseInt(e.target.value) || 0 }))}
                            />
                            <Input
                              type="number"
                              placeholder="Tỷ số người thua"
                              value={matchResult.loserScore}
                              onChange={(e) => setMatchResult(prev => ({ ...prev, loserScore: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <Textarea
                            placeholder="Ghi chú về trận đấu..."
                            value={matchResult.notes}
                            onChange={(e) => setMatchResult(prev => ({ ...prev, notes: e.target.value }))}
                          />
                          <Button
                            onClick={completeChallenge}
                            className="w-full"
                          >
                            Hoàn thành thách đấu
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChallengeWorkflowManager;