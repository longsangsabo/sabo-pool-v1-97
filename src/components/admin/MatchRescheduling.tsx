import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Match {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  scheduled_time?: string;
  status: string;
  player1?: { full_name: string };
  player2?: { full_name: string };
}

interface MatchReschedulingProps {
  tournamentId: string;
  matches: Match[];
  onMatchUpdate: () => void;
}

const MatchRescheduling: React.FC<MatchReschedulingProps> = ({
  tournamentId,
  matches,
  onMatchUpdate
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReschedule = async () => {
    if (!selectedMatch || !newDateTime) {
      toast.error('Vui lòng chọn trận đấu và thời gian mới');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          scheduled_time: newDateTime,
          status: 'rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      // Log the rescheduling action
      await supabase
        .from('match_events')
        .insert({
          match_id: selectedMatch.id,
          event_type: 'rescheduled',
          event_data: {
            old_time: selectedMatch.scheduled_time,
            new_time: newDateTime,
            reason: reason
          },
          reported_by: (await supabase.auth.getUser()).data.user?.id
        });

      toast.success('Đã lên lịch lại trận đấu thành công');
      setSelectedMatch(null);
      setNewDateTime('');
      setReason('');
      onMatchUpdate();
    } catch (error) {
      console.error('Error rescheduling match:', error);
      toast.error('Có lỗi xảy ra khi lên lịch lại trận đấu');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      rescheduled: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lên lịch lại trận đấu
          </CardTitle>
          <CardDescription>
            Thay đổi thời gian và lịch thi đấu cho các trận đấu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Match Selection */}
          <div className="space-y-2">
            <Label htmlFor="match-select">Chọn trận đấu</Label>
            <Select
              value={selectedMatch?.id || ''}
              onValueChange={(value) => {
                const match = matches.find(m => m.id === value);
                setSelectedMatch(match || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trận đấu cần lên lịch lại" />
              </SelectTrigger>
              <SelectContent>
                {matches.filter(m => ['scheduled', 'rescheduled'].includes(m.status)).map((match) => (
                  <SelectItem key={match.id} value={match.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        Vòng {match.round_number} - Trận {match.match_number}: {' '}
                        {match.player1?.full_name || 'TBD'} vs {match.player2?.full_name || 'TBD'}
                      </span>
                      {getStatusBadge(match.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMatch && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Thời gian hiện tại</Label>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.scheduled_time 
                      ? new Date(selectedMatch.scheduled_time).toLocaleString('vi-VN')
                      : 'Chưa có lịch'}
                  </p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMatch.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-datetime">Thời gian mới</Label>
                <Input
                  id="new-datetime"
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Lý do lên lịch lại</Label>
                <Textarea
                  id="reason"
                  placeholder="Nhập lý do cần lên lịch lại trận đấu..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleReschedule}
                disabled={isLoading || !newDateTime}
                className="w-full"
              >
                {isLoading ? 'Đang xử lý...' : 'Lên lịch lại trận đấu'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Rescheduling History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lịch sử lên lịch lại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {matches
              .filter(m => m.status === 'rescheduled')
              .slice(0, 5)
              .map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">
                      Vòng {match.round_number} - Trận {match.match_number}
                    </span>
                    <p className="text-sm text-gray-600">
                      {match.player1?.full_name || 'TBD'} vs {match.player2?.full_name || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {match.scheduled_time 
                        ? new Date(match.scheduled_time).toLocaleString('vi-VN')
                        : 'Chưa có lịch'}
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </div>
              ))}
            {matches.filter(m => m.status === 'rescheduled').length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Chưa có trận đấu nào được lên lịch lại
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchRescheduling;