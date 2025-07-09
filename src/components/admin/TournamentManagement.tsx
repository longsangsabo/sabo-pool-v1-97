import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Search,
  RefreshCw,
  Trophy,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  Edit
} from 'lucide-react';
import { TournamentService } from '@/services/TournamentService';
import { TournamentActions } from './TournamentActions';
import { EnhancedTournament } from '@/types/tournament-extended';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<EnhancedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, [showDeleted]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const result = await TournamentService.getTournaments({
        showDeleted,
        search: searchTerm,
        limit: 50
      });
      setTournaments(result.tournaments);
      
      // Nếu không có dữ liệu và chưa có tournament nào, tạo dữ liệu mẫu
      if (result.tournaments.length === 0 && !showDeleted && searchTerm === '') {
        await createSampleTournaments();
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  // Tạo giải đấu mẫu nếu không có dữ liệu
  const createSampleTournaments = async () => {
    try {
      const sampleTournaments = [
        {
          name: 'Giải đấu Pool 8 Ball - Cúp mùa đông',
          description: 'Giải đấu 8-ball dành cho người chơi hạng K-A',
          tournament_type: 'single_elimination',
          max_participants: 16,
          current_participants: 8,
          registration_start: new Date().toISOString(),
          registration_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tournament_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          tournament_end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
          venue_address: 'CLB Billiards Sài Gòn, Quận 1, TP.HCM',
          entry_fee: 50000,
          prize_pool: 800000,
          status: 'registration_open'
        },
        {
          name: 'Giải Pool 9 Ball Professional',
          description: 'Giải đấu 9-ball dành cho người chơi chuyên nghiệp',
          tournament_type: 'double_elimination',
          max_participants: 32,
          current_participants: 12,
          registration_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          registration_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          tournament_start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          tournament_end: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
          venue_address: 'CLB Pool Arena, Quận 3, TP.HCM',
          entry_fee: 200000,
          prize_pool: 6400000,
          status: 'upcoming'
        }
      ];

      for (const tournament of sampleTournaments) {
        const { error } = await supabase.from('tournaments').insert(tournament);
        if (error) {
          console.error('Error creating sample tournament:', error);
        }
      }
      
      toast.success('Đã tạo dữ liệu giải đấu mẫu');
      // Refresh lại danh sách
      setTimeout(() => {
        fetchTournaments();
      }, 1000);
    } catch (error) {
      console.error('Error creating sample tournaments:', error);
    }
  };

  const handleSearch = () => {
    fetchTournaments();
  };

  const handleTournamentUpdated = () => {
    fetchTournaments();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'ongoing':
        return 'Đang thi đấu';
      case 'completed':
        return 'Đã kết thúc';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Quản lý giải đấu</CardTitle>
              <p className="text-muted-foreground mt-1">
                Xem, xóa và khôi phục giải đấu
              </p>
            </div>
            <Button onClick={fetchTournaments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-deleted"
                  checked={showDeleted}
                  onCheckedChange={setShowDeleted}
                />
                <Label htmlFor="show-deleted">
                  {showDeleted ? 'Hiển thị giải đấu đã xóa' : 'Hiển thị giải đấu hoạt động'}
                </Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Tìm kiếm giải đấu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tournament List */}
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className={`hover:shadow-md transition-shadow ${showDeleted ? 'bg-red-50 border-red-200' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{tournament.name}</h3>
                        <Badge className={getStatusColor(tournament.status)}>
                          {getStatusText(tournament.status)}
                        </Badge>
                        {showDeleted && (
                          <Badge variant="destructive">
                            Đã xóa
                          </Badge>
                        )}
                      </div>
                      
                      {tournament.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(tournament.tournament_start)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {tournament.current_participants}/{tournament.max_participants} người
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(tournament.prize_pool)}</span>
                        </div>
                        
                        {tournament.venue_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{tournament.venue_address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/tournaments/${tournament.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      
                      <TournamentActions
                        tournamentId={tournament.id}
                        tournamentName={tournament.name}
                        isDeleted={showDeleted}
                        onDeleted={handleTournamentUpdated}
                        onRestored={handleTournamentUpdated}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tournaments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {showDeleted ? 'Không có giải đấu nào đã bị xóa' : 'Không có giải đấu nào'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showDeleted 
                    ? 'Tất cả giải đấu đang hoạt động bình thường'
                    : 'Hệ thống sẽ tự động tạo dữ liệu mẫu để bạn có thể thử nghiệm'
                  }
                </p>
                {!showDeleted && (
                  <Button onClick={createSampleTournaments} variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    Tạo dữ liệu mẫu
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentManagement;