import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Trophy, Save, X } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useMatchManagement';

interface MatchScoreEntryProps {
  match: TournamentMatch;
  onUpdateScore: (matchId: string, player1Score: number, player2Score: number, winnerId?: string) => Promise<void>;
  onStartMatch: (matchId: string) => Promise<void>;
  onCancelMatch: (matchId: string) => Promise<void>;
  isUpdating?: boolean;
  isStarting?: boolean;
  isCancelling?: boolean;
}

export const MatchScoreEntry: React.FC<MatchScoreEntryProps> = ({
  match,
  onUpdateScore,
  onStartMatch,
  onCancelMatch,
  isUpdating,
  isStarting,
  isCancelling
}) => {
  const [player1Score, setPlayer1Score] = useState(match.player1_score);
  const [player2Score, setPlayer2Score] = useState(match.player2_score);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveScore = async () => {
    if (!match.player1_id || !match.player2_id) {
      return;
    }

    let winnerId: string | undefined;
    if (player1Score > player2Score) {
      winnerId = match.player1_id;
    } else if (player2Score > player1Score) {
      winnerId = match.player2_id;
    }

    try {
      await onUpdateScore(match.id, player1Score, player2Score, winnerId);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleCancel = () => {
    setPlayer1Score(match.player1_score);
    setPlayer2Score(match.player2_score);
    setIsEditing(false);
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Vòng {match.round_number} - Trận {match.match_number}
          </CardTitle>
          <Badge className={`${getStatusColor(match.status)} text-white`}>
            {getStatusText(match.status)}
          </Badge>
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
            {isEditing && canEdit ? (
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                />
                <span className="text-lg font-bold">-</span>
                <Input
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
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

        {match.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Ghi chú:</strong> {match.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSaveScore}
                disabled={isUpdating}
                size="sm"
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
            </>
          ) : (
            <>
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

              {canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  Nhập tỉ số
                </Button>
              )}

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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};