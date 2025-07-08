import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trophy, Clock, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MatchReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onReportSubmitted: () => void;
}

export const MatchReportingModal: React.FC<MatchReportingModalProps> = ({
  isOpen,
  onClose,
  match,
  onReportSubmitted
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    player1_score: '',
    player2_score: '',
    winner_id: '',
    duration_minutes: '',
    match_notes: '',
    match_format: 'race_to_5'
  });

  const isPlayer1 = user?.id === match?.player1_id;
  const isPlayer2 = user?.id === match?.player2_id;
  const canReport = isPlayer1 || isPlayer2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReport || !user) {
      toast.error('Bạn không có quyền báo cáo trận đấu này');
      return;
    }

    setIsSubmitting(true);
    try {
      const player1Score = parseInt(formData.player1_score);
      const player2Score = parseInt(formData.player2_score);
      
      if (isNaN(player1Score) || isNaN(player2Score)) {
        toast.error('Vui lòng nhập điểm số hợp lệ');
        return;
      }

      // Xác định người thắng dựa trên điểm số
      let winnerId = null;
      if (player1Score > player2Score) {
        winnerId = match.player1_id;
      } else if (player2Score > player1Score) {
        winnerId = match.player2_id;
      }

      // Tạo kết quả trận đấu
      const { data, error } = await supabase
        .from('match_results')
        .insert({
          tournament_id: match.tournament_id,
          match_id: match.id,
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          match_notes: formData.match_notes,
          match_format: formData.match_format,
          created_by: user.id,
          result_status: 'pending_confirmation'
        })
        .select()
        .single();

      if (error) throw error;

      // Cập nhật trạng thái trận đấu
      await supabase
        .from('tournament_matches')
        .update({
          status: 'completed',
          winner_id: winnerId,
          score_player1: player1Score,
          score_player2: player2Score,
          actual_end_time: new Date().toISOString()
        })
        .eq('id', match.id);

      toast.success('Đã báo cáo kết quả trận đấu! Đang chờ xác nhận từ đối thủ.');
      onReportSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Error reporting match:', error);
      toast.error('Có lỗi xảy ra khi báo cáo kết quả trận đấu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Báo Cáo Kết Quả Trận Đấu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin trận đấu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông Tin Trận Đấu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vòng {match.round_number}, Trận {match.match_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(match.scheduled_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="font-medium">Người chơi 1</div>
                  <Badge variant={isPlayer1 ? "default" : "secondary"} className="mt-1">
                    {match.player1?.full_name || 'TBD'}
                  </Badge>
                </div>
                <div className="text-center px-4">
                  <span className="text-2xl font-bold text-muted-foreground">VS</span>
                </div>
                <div className="text-center flex-1">
                  <div className="font-medium">Người chơi 2</div>
                  <Badge variant={isPlayer2 ? "default" : "secondary"} className="mt-1">
                    {match.player2?.full_name || 'TBD'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form báo cáo kết quả */}
          {canReport ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kết Quả Trận Đấu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor="player1_score">
                        Điểm {match.player1?.full_name || 'Người chơi 1'}
                      </Label>
                      <Input
                        id="player1_score"
                        type="number"
                        min="0"
                        value={formData.player1_score}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          player1_score: e.target.value
                        }))}
                        required
                      />
                    </div>
                    
                    <div className="text-center">
                      <span className="text-xl font-bold">-</span>
                    </div>
                    
                    <div>
                      <Label htmlFor="player2_score">
                        Điểm {match.player2?.full_name || 'Người chơi 2'}
                      </Label>
                      <Input
                        id="player2_score"
                        type="number"
                        min="0"
                        value={formData.player2_score}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          player2_score: e.target.value
                        }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="match_format">Thể thức thi đấu</Label>
                      <Select
                        value={formData.match_format}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          match_format: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="race_to_3">Race to 3</SelectItem>
                          <SelectItem value="race_to_5">Race to 5</SelectItem>
                          <SelectItem value="race_to_7">Race to 7</SelectItem>
                          <SelectItem value="best_of_3">Best of 3</SelectItem>
                          <SelectItem value="best_of_5">Best of 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration_minutes">Thời gian (phút)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        min="1"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          duration_minutes: e.target.value
                        }))}
                        placeholder="Thời gian thi đấu"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="match_notes">Ghi chú về trận đấu</Label>
                    <Textarea
                      id="match_notes"
                      value={formData.match_notes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        match_notes: e.target.value
                      }))}
                      placeholder="Ghi chú về trận đấu (tùy chọn)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Báo Cáo Kết Quả'}
                </Button>
              </div>
            </form>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <p>Bạn không phải là người chơi trong trận đấu này.</p>
                  <p>Chỉ có người chơi tham gia mới có thể báo cáo kết quả.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};