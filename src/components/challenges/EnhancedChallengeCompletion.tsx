import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Target, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  bet_points: number;
  race_to: number;
  challenger_name?: string;
  opponent_name?: string;
  created_at: string;
}

interface EnhancedChallengeCompletionProps {
  challenge: Challenge;
  onComplete: () => void;
  onCancel?: () => void;
}

export function EnhancedChallengeCompletion({ 
  challenge, 
  onComplete, 
  onCancel 
}: EnhancedChallengeCompletionProps) {
  const { user } = useAuth();
  const { 
    completeChallengeEnhanced, 
    isCompleting,
    dailyStats,
    getRemainingChallenges 
  } = useEnhancedChallenges();

  const [winnerId, setWinnerId] = useState<string>('');
  const [winnerScore, setWinnerScore] = useState<number>(challenge.race_to);
  const [loserScore, setLoserScore] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const isChallenger = user?.id === challenge.challenger_id;
  const isOpponent = user?.id === challenge.opponent_id;
  const canSubmit = winnerId && winnerScore >= 0 && loserScore >= 0;

  // Check if overtime penalty might apply
  const challengeAge = Date.now() - new Date(challenge.created_at).getTime();
  const isOvertime = challengeAge > 2 * 60 * 60 * 1000; // 2 hours

  // Check if daily limit reduction applies
  const remainingChallenges = getRemainingChallenges();
  const dailyLimitApplies = dailyStats?.count >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (winnerScore < challenge.race_to) {
      toast.error(`Người thắng phải đạt ít nhất ${challenge.race_to} điểm`);
      return;
    }

    const loserId = winnerId === challenge.challenger_id ? challenge.opponent_id : challenge.challenger_id;

    try {
      await completeChallengeEnhanced({
        challengeId: challenge.id,
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        notes: notes.trim() || undefined
      });

      toast.success('Đã hoàn thành thách đấu thành công!');
      onComplete();
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error('Lỗi khi hoàn thành thách đấu');
    }
  };

  const getWinnerName = () => {
    if (winnerId === challenge.challenger_id) {
      return challenge.challenger_name || 'Người thách đấu';
    }
    return challenge.opponent_name || 'Đối thủ';
  };

  const getLoserName = () => {
    if (winnerId === challenge.challenger_id) {
      return challenge.opponent_name || 'Đối thủ';
    }
    return challenge.challenger_name || 'Người thách đấu';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Hoàn thành thách đấu
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>Race to {challenge.race_to}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>{challenge.bet_points} SPA điểm</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Winner Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Người thắng</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant={winnerId === challenge.challenger_id ? 'default' : 'outline'}
                onClick={() => setWinnerId(challenge.challenger_id)}
                className="h-12 justify-start"
              >
                <div className="flex items-center gap-2">
                  {winnerId === challenge.challenger_id && <CheckCircle2 className="h-4 w-4" />}
                  <span>{challenge.challenger_name || 'Người thách đấu'}</span>
                </div>
              </Button>
              <Button
                variant={winnerId === challenge.opponent_id ? 'default' : 'outline'}
                onClick={() => setWinnerId(challenge.opponent_id)}
                className="h-12 justify-start"
              >
                <div className="flex items-center gap-2">
                  {winnerId === challenge.opponent_id && <CheckCircle2 className="h-4 w-4" />}
                  <span>{challenge.opponent_name || 'Đối thủ'}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Score Input */}
          {winnerId && (
            <div className="space-y-4">
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="winner-score">
                    Điểm của {getWinnerName()}
                  </Label>
                  <Input
                    id="winner-score"
                    type="number"
                    min={challenge.race_to}
                    value={winnerScore}
                    onChange={(e) => setWinnerScore(parseInt(e.target.value) || 0)}
                    placeholder={`Tối thiểu ${challenge.race_to}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loser-score">
                    Điểm của {getLoserName()}
                  </Label>
                  <Input
                    id="loser-score"
                    type="number"
                    min={0}
                    max={challenge.race_to - 1}
                    value={loserScore}
                    onChange={(e) => setLoserScore(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bonus Indicators */}
          {winnerId && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Thông tin thưởng điểm</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {isOvertime && (
                    <Alert className="p-3">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Overtime: Giảm 70% điểm
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {dailyLimitApplies && (
                    <Alert className="p-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Hạn chế hàng ngày: Giảm 70% điểm
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span>Thưởng chuỗi: Tự động tính</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thêm ghi chú về trận đấu..."
              rows={3}
            />
          </div>

          {/* Daily Challenge Status */}
          {dailyStats && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Thách đấu hôm nay: {dailyStats.count}/2
                {dailyStats.limitReached && (
                  <span className="text-orange-600 font-medium"> - Đã đạt giới hạn</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isCompleting}
              className="flex-1"
            >
              {isCompleting ? 'Đang xử lý...' : 'Hoàn thành thách đấu'}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}