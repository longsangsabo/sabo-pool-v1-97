import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, FileText, Eye, Plus, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MatchIncident {
  id: string;
  match_id: string;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reported_by?: string;
  created_at: string;
  match?: {
    round_number: number;
    match_number: number;
    player1?: { full_name: string };
    player2?: { full_name: string };
  };
}

interface MatchIncidentReportingProps {
  tournamentId: string;
  matches: any[];
}

const MatchIncidentReporting: React.FC<MatchIncidentReportingProps> = ({
  tournamentId,
  matches
}) => {
  const [incidents, setIncidents] = useState<MatchIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    match_id: '',
    incident_type: '',
    description: '',
    severity: 'medium' as const
  });

  const incidentTypes = [
    'Tranh chấp điểm số',
    'Vi phạm luật chơi',
    'Hành vi phi thể thao',
    'Thiết bị bị hỏng',
    'Vắng mặt không báo',
    'Gian lận',
    'Khác'
  ];

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    investigating: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  useEffect(() => {
    loadIncidents();
  }, [tournamentId]);

  const loadIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          id,
          match_id,
          event_type,
          event_data,
          created_at,
          reported_by,
          tournament_matches!inner(
            round_number,
            match_number,
            player1:profiles!tournament_matches_player1_id_fkey(full_name),
            player2:profiles!tournament_matches_player2_id_fkey(full_name)
          )
        `)
        .eq('tournament_matches.tournament_id', tournamentId)
        .eq('event_type', 'incident')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedIncidents = data.map(incident => ({
        id: incident.id,
        match_id: incident.match_id,
        incident_type: (incident.event_data as any)?.incident_type || 'Khác',
        description: (incident.event_data as any)?.description || '',
        severity: (incident.event_data as any)?.severity || 'medium',
        status: (incident.event_data as any)?.status || 'open',
        reported_by: incident.reported_by,
        created_at: incident.created_at,
        match: incident.tournament_matches
      }));

      setIncidents(formattedIncidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Có lỗi khi tải danh sách sự cố');
    }
  };

  const handleCreateIncident = async () => {
    if (!formData.match_id || !formData.incident_type || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('match_events')
        .insert({
          match_id: formData.match_id,
          event_type: 'incident',
          event_data: {
            incident_type: formData.incident_type,
            description: formData.description,
            severity: formData.severity,
            status: 'open'
          },
          reported_by: user.user?.id
        });

      if (error) throw error;

      toast.success('Đã báo cáo sự cố thành công');
      setShowCreateDialog(false);
      setFormData({
        match_id: '',
        incident_type: '',
        description: '',
        severity: 'medium'
      });
      loadIncidents();
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Có lỗi khi báo cáo sự cố');
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('match_events')
        .update({
          event_data: {
            ...(incidents.find(i => i.id === incidentId) ? {
              incident_type: incidents.find(i => i.id === incidentId)!.incident_type,
              description: incidents.find(i => i.id === incidentId)!.description,
              severity: incidents.find(i => i.id === incidentId)!.severity
            } : {}),
            status: newStatus
          }
        })
        .eq('id', incidentId);

      if (error) throw error;

      toast.success('Đã cập nhật trạng thái sự cố');
      loadIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast.error('Có lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Báo cáo sự cố trận đấu
              </CardTitle>
              <CardDescription>
                Quản lý và theo dõi các sự cố xảy ra trong tournament
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Báo cáo sự cố
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Báo cáo sự cố mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="match">Trận đấu</Label>
                    <Select
                      value={formData.match_id}
                      onValueChange={(value) => setFormData({...formData, match_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trận đấu" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches.map((match) => (
                          <SelectItem key={match.id} value={match.id}>
                            Vòng {match.round_number} - Trận {match.match_number}: {' '}
                            {match.player1?.full_name || 'TBD'} vs {match.player2?.full_name || 'TBD'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident-type">Loại sự cố</Label>
                    <Select
                      value={formData.incident_type}
                      onValueChange={(value) => setFormData({...formData, incident_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại sự cố" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Mức độ nghiêm trọng</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: any) => setFormData({...formData, severity: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="critical">Nghiêm trọng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả chi tiết</Label>
                    <Textarea
                      id="description"
                      placeholder="Mô tả chi tiết về sự cố..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateIncident}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Đang xử lý...' : 'Báo cáo sự cố'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có sự cố nào được báo cáo</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <Card key={incident.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{incident.incident_type}</h4>
                        <p className="text-sm text-gray-600">
                          Vòng {incident.match?.round_number} - Trận {incident.match?.match_number}: {' '}
                          {incident.match?.player1?.full_name || 'TBD'} vs {incident.match?.player2?.full_name || 'TBD'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={severityColors[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        <Badge className={statusColors[incident.status]}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{incident.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(incident.created_at).toLocaleString('vi-VN')}
                      </span>
                      
                      {incident.status !== 'closed' && (
                        <div className="flex gap-2">
                          {incident.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                            >
                              Điều tra
                            </Button>
                          )}
                          {incident.status === 'investigating' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                            >
                              Đã giải quyết
                            </Button>
                          )}
                          {incident.status === 'resolved' && (
                            <Button
                              size="sm"
                              onClick={() => updateIncidentStatus(incident.id, 'closed')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Đóng
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchIncidentReporting;