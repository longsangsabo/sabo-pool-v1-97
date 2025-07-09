import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trophy, Calendar, Users, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_type: string;
  status: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  created_at: string;
}

const ClubTournamentManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getClubId();
    }
  }, [user]);

  useEffect(() => {
    if (clubId) {
      fetchTournaments();
    }
  }, [clubId]);

  const getClubId = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setClubId(data.id);
    } catch (error) {
      console.error('Error getting club ID:', error);
      toast.error('Không thể lấy thông tin CLB');
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'upcoming': { label: 'Sắp diễn ra', variant: 'default' as const },
      'registration_open': { label: 'Đang mở đăng ký', variant: 'default' as const },
      'registration_closed': { label: 'Đã đóng đăng ký', variant: 'secondary' as const },
      'ongoing': { label: 'Đang diễn ra', variant: 'default' as const },
      'completed': { label: 'Đã kết thúc', variant: 'outline' as const },
      'cancelled': { label: 'Đã hủy', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTournamentTypeLabel = (type: string) => {
    const typeMap = {
      'single_elimination': 'Loại trực tiếp',
      'double_elimination': 'Loại kép',
      'round_robin': 'Vòng tròn',
      'swiss': 'Swiss'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const handleCreateTournament = () => {
    navigate('/tournaments');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý Giải đấu</h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các giải đấu do CLB tổ chức
          </p>
        </div>
        <Button onClick={handleCreateTournament} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo giải đấu mới
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
          <TabsTrigger value="completed">Đã kết thúc</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {tournaments.filter(t => ['registration_open', 'ongoing'].includes(t.status)).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có giải đấu nào đang hoạt động</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Tạo giải đấu mới để bắt đầu thu hút người chơi tham gia
                </p>
                <Button onClick={handleCreateTournament}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo giải đấu đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tournaments.filter(t => ['registration_open', 'ongoing'].includes(t.status)).map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {tournaments.filter(t => t.status === 'upcoming').map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {tournaments.filter(t => t.status === 'completed').map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'upcoming': { label: 'Sắp diễn ra', variant: 'default' as const },
      'registration_open': { label: 'Đang mở đăng ký', variant: 'default' as const },
      'registration_closed': { label: 'Đã đóng đăng ký', variant: 'secondary' as const },
      'ongoing': { label: 'Đang diễn ra', variant: 'default' as const },
      'completed': { label: 'Đã kết thúc', variant: 'outline' as const },
      'cancelled': { label: 'Đã hủy', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTournamentTypeLabel = (type: string) => {
    const typeMap = {
      'single_elimination': 'Loại trực tiếp',
      'double_elimination': 'Loại kép',
      'round_robin': 'Vòng tròn',
      'swiss': 'Swiss'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{tournament.description}</p>
          </div>
          {getStatusBadge(tournament.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">Loại giải</p>
            <p className="text-sm text-muted-foreground">{getTournamentTypeLabel(tournament.tournament_type)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Người tham gia</p>
            <p className="text-sm text-muted-foreground">
              {tournament.current_participants}/{tournament.max_participants}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Phí tham gia</p>
            <p className="text-sm text-muted-foreground">
              {tournament.entry_fee.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Bắt đầu</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(tournament.tournament_start), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Xem chi tiết
          </Button>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Quản lý thành viên
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Cài đặt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubTournamentManagement;