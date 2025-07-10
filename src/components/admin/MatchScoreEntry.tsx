import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trophy, Save, X, Edit, RotateCcw, AlertCircle } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useMatchManagement';
import { toast } from 'sonner';

interface MatchScoreEntryProps {
  match: TournamentMatch;
  onUpdateScore: (matchId: string, player1Score: number, player2Score: number, winnerId?: string) => Promise<void>;
  onStartMatch: (matchId: string) => Promise<void>;
  onCancelMatch: (matchId: string) => Promise<void>;
  onRestoreMatch: (matchId: string) => Promise<void>;
  isUpdating?: boolean;
  isStarting?: boolean;
  isCancelling?: boolean;
  isRestoring?: boolean;
}

export const MatchScoreEntry: React.FC<MatchScoreEntryProps> = ({
  match,
  onUpdateScore,
  onStartMatch,
  onCancelMatch,
  onRestoreMatch,
  isUpdating,
  isStarting,
  isCancelling,
  isRestoring
}) => {
  const [player1Score, setPlayer1Score] = useState(match.player1_score);
  const [player2Score, setPlayer2Score] = useState(match.player2_score);
  const [isEditing, setIsEditing] = useState(false);
  const [lastSavedScore, setLastSavedScore] = useState({ 
    player1: match.player1_score, 
    player2: match.player2_score 
  });

  // Update local state when match props change
  useEffect(() => {
    setPlayer1Score(match.player1_score);
    setPlayer2Score(match.player2_score);
    setLastSavedScore({ 
      player1: match.player1_score, 
      player2: match.player2_score 
    });
  }, [match.player1_score, match.player2_score]);

  const handleSaveScore = async () => {
    if (!match.player1_id || !match.player2_id) {
      toast.error('Không thể cập nhật tỉ số - thiếu thông tin người chơi');
      return;
    }

    // Validation
    if (player1Score < 0 || player2Score < 0) {
      toast.error('Tỉ số không thể âm');
      return;
    }

    if (player1Score === player2Score && (player1Score > 0 || player2Score > 0)) {
      toast.warning('Trận đấu hòa - vui lòng xác nhận');
    }

    let winnerId: string | undefined;
    if (player1Score > player2Score) {
      winnerId = match.player1_id;
    } else if (player2Score > player1Score) {
      winnerId = match.player2_id;
    }

    try {
      await onUpdateScore(match.id, player1Score, player2Score, winnerId);
      setLastSavedScore({ player1: player1Score, player2: player2Score });
      setIsEditing(false);
      toast.success('Tỉ số đã được cập nhật thành công!');
    } catch (error: any) {
      console.error('Error updating score:', error);
      toast.error(`Lỗi cập nhật tỉ số: ${error?.message || 'Không xác định'}`);
      // Reset to last known good values
      setPlayer1Score(lastSavedScore.player1);
      setPlayer2Score(lastSavedScore.player2);
    }
  };

  const handleCancel = () => {
    setPlayer1Score(match.player1_score);
    setPlayer2Score(match.player2_score);
    setIsEditing(false);
  };

  const handleEditScore = () => {
    if (match.status === 'completed' || match.status === 'in_progress') {
      setIsEditing(true);
    }
  };

  const handleRestoreMatch = async () => {
    try {
      await onRestoreMatch(match.id);
      toast.success('Trận đấu đã được khôi phục!');
    } catch (error: any) {
      console.error('Error restoring match:', error);
      toast.error(`Lỗi khôi phục trận đấu: ${error?.message || 'Không xác định'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Chưa bắt đầu';
      case 'in_progress': return 'Đang thi đấu';
      case 'completed': return 'Đã kết thúc';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const isMatchActive = match.status === 'in_progress' || match.status === 'scheduled';
  const canEdit = isMatchActive && (match.player1_id && match.player2_id);
  const canEditCompleted = match.status === 'completed' && (match.player1_id && match.player2_id);
  const canRestore = match.status === 'cancelled';
  const hasScoreChange = player1Score !== match.player1_score || player2Score !== match.player2_score;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {match.notes && (match.notes.includes('Tranh hạng 3-4') || match.notes.includes('Chung kết'))
              ? match.notes
              : `Vòng ${match.round_number} - Trận ${match.match_number}`
            }
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(match.status)} text-white`}>
              {getStatusText(match.status)}
            </Badge>
            {hasScoreChange && isEditing && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Chưa lưu
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Players and Scores */}
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Player 1 */}
          <div className="text-center">
            <div className="font-medium text-lg">
              {match.player1?.display_name || match.player1?.full_name || 'TBD'}
            </div>
            {match.winner_id === match.player1_id && (
              <Trophy className="h-5 w-5 text-yellow-500 mx-auto mt-1" />
            )}
          </div>

          {/* Score */}
          <div className="text-center">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                  disabled={isUpdating}
                />
                <span className="text-lg font-bold">-</span>
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                  disabled={isUpdating}
                />
              </div>
            ) : (
              <div className="text-3xl font-bold">
                {match.player1_score} - {match.player2_score}
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className="text-center">
            <div className="font-medium text-lg">
              {match.player2?.display_name || match.player2?.full_name || 'TBD'}
            </div>
            {match.winner_id === match.player2_id && (
              <Trophy className="h-5 w-5 text-yellow-500 mx-auto mt-1" />
            )}
          </div>
        </div>

        {/* Match Info */}
        {match.scheduled_time && (
          <div className="text-sm text-muted-foreground text-center">
            Lịch thi đấu: {new Date(match.scheduled_time).toLocaleString('vi-VN')}
          </div>
        )}

        {match.started_at && (
          <div className="text-sm text-muted-foreground text-center">
            Bắt đầu: {new Date(match.started_at).toLocaleString('vi-VN')}
          </div>
        )}

        {match.completed_at && (
          <div className="text-sm text-muted-foreground text-center">
            Kết thúc: {new Date(match.completed_at).toLocaleString('vi-VN')}
          </div>
        )}

        {match.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Ghi chú:</strong> {match.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 pt-2 flex-wrap">
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveScore}
                disabled={isUpdating || !hasScoreChange}
                size="sm"
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'Đang lưu...' : 'Lưu tỉ số'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
            </>
          ) : (
            <>
              {/* Start Match Button */}
              {match.status === 'scheduled' && canEdit && (
                <Button
                  onClick={() => onStartMatch(match.id)}
                  disabled={isStarting}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Play className="h-4 w-4" />
                  {isStarting ? 'Đang bắt đầu...' : 'Bắt đầu'}
                </Button>
              )}

              {/* Enter/Edit Score Button */}
              {canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Nhập tỉ số
                </Button>
              )}

              {/* Edit Completed Match Score */}
              {canEditCompleted && (
                <Button
                  onClick={handleEditScore}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Sửa tỉ số
                </Button>
              )}

              {/* Cancel Match Button */}
              {isMatchActive && (
                <Button
                  onClick={() => onCancelMatch(match.id)}
                  disabled={isCancelling}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Pause className="h-4 w-4" />
                  {isCancelling ? 'Đang hủy...' : 'Hủy trận'}
                </Button>
              )}

              {/* Restore Match Button */}
              {canRestore && (
                <Button
                  onClick={handleRestoreMatch}
                  disabled={isRestoring}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isRestoring ? 'Đang khôi phục...' : 'Khôi phục trận'}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Status Messages */}
        {match.status === 'cancelled' && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Trận đấu đã bị hủy. Nhấn "Khôi phục trận" để hoàn tác.
          </div>
        )}

        {isUpdating && (
          <div className="text-center text-sm text-blue-600 bg-blue-50 p-2 rounded">
            Đang cập nhật tỉ số...
          </div>
        )}
      </CardContent>
    </Card>
  );
};