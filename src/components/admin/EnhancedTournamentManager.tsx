import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Trophy, Users, Settings, Eye, Play, 
  Pause, SquareCheckBig, BarChart3, Edit, Trash2, 
  Clock, MapPin, DollarSign, Medal, Activity 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTournaments } from '@/hooks/useTournaments';

interface Tournament {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'registration_open' | 'ongoing' | 'completed';
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  current_participants: number;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
  tournament_type: string;
  game_format: string;
  venue_name?: string;
  venue_address?: string;
  rules?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const EnhancedTournamentManager = () => {
  const { tournaments, loading, createTournament } = useTournaments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalPrizePool: 0
  });

  // Real-time tournament updates
  useEffect(() => {
    console.log('Setting up real-time tournament subscription');
    const channel = supabase
      .channel('admin-tournaments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournaments'
      }, (payload) => {
        console.log('Real-time tournament update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newTournament = payload.new as Tournament;
          toast.info(`Giải đấu mới: ${newTournament.name}`);
        } else if (payload.eventType === 'UPDATE') {
          const updatedTournament = payload.new as Tournament;
          if (payload.old?.status !== payload.new?.status) {
            const statusText = getStatusText(updatedTournament.status);
            toast.success(`Giải đấu "${updatedTournament.name}" ${statusText}`);
          }
        }
        
        // Refresh data
        window.location.reload();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up tournament subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate real-time stats
  useEffect(() => {
    if (tournaments) {
      const stats = tournaments.reduce((acc, tournament) => {
        acc.total += 1;
        if (tournament.status === 'ongoing' || tournament.status === 'registration_open') {
          acc.active += 1;
        }
        if (tournament.status === 'completed') {
          acc.completed += 1;
        }
        acc.totalPrizePool += tournament.prize_pool || 0;
        return acc;
      }, { total: 0, active: 0, completed: 0, totalPrizePool: 0 });
      
      setRealTimeStats(stats);
    }
  }, [tournaments]);

  const handleStartTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'ongoing' })
        .eq('id', tournamentId);

      if (error) throw error;
      toast.success('Giải đấu đã bắt đầu!');
    } catch (error) {
      console.error('Error starting tournament:', error);
      toast.error('Có lỗi khi bắt đầu giải đấu');
    }
  };

  const handlePauseTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'upcoming' })
        .eq('id', tournamentId);

      if (error) throw error;
      toast.success('Giải đấu đã tạm dừng!');
    } catch (error) {
      console.error('Error pausing tournament:', error);
      toast.error('Có lỗi khi tạm dừng giải đấu');
    }
  };

  const handleCompleteTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournamentId);

      if (error) throw error;
      toast.success('Giải đấu đã hoàn thành!');
    } catch (error) {
      console.error('Error completing tournament:', error);
      toast.error('Có lỗi khi hoàn thành giải đấu');
    }
  };

  const handleGenerateBracket = async (tournamentId: string) => {
    try {
      // Mock bracket generation - replace with actual implementation
      toast.success('Bảng đấu đã được tạo!');
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast.error('Có lỗi khi tạo bảng đấu');
    }
  };

  const filteredTournaments = tournaments?.filter(tournament => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
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
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Tổng giải đấu',
      value: realTimeStats.total.toString(),
      icon: Trophy,
      color: 'text-blue-600'
    },
    {
      title: 'Đang hoạt động',
      value: realTimeStats.active.toString(),
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Đã hoàn thành',
      value: realTimeStats.completed.toString(),
      icon: Medal,
      color: 'text-purple-600'
    },
    {
      title: 'Tổng giải thưởng',
      value: formatPrize(realTimeStats.totalPrizePool),
      icon: DollarSign,
      color: 'text-yellow-600'
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Stats */}
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Quản Lý Giải Đấu Nâng Cao
            </h1>
            <p className='text-gray-600'>Tạo, quản lý và theo dõi các giải đấu bida</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className='gap-2'>
            <Plus className='w-4 h-4' />
            Tạo Giải Đấu Mới
          </Button>
        </div>

        {/* Real-time Stats Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <Input
            placeholder='Tìm kiếm giải đấu...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='upcoming'>Sắp diễn ra</SelectItem>
            <SelectItem value='registration_open'>Đang mở đăng ký</SelectItem>
            <SelectItem value='ongoing'>Đang diễn ra</SelectItem>
            <SelectItem value='completed'>Đã kết thúc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tournaments Management */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Dạng lưới</TabsTrigger>
          <TabsTrigger value="table">Dạng bảng</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredTournaments.map(tournament => (
              <Card key={tournament.id} className='hover:shadow-lg transition-shadow'>
                <CardHeader>
                  <div className='flex justify-between items-start mb-2'>
                    <CardTitle className='text-xl'>{tournament.name}</CardTitle>
                    <Badge className={getStatusColor(tournament.status)}>
                      {getStatusText(tournament.status)}
                    </Badge>
                  </div>
                  <CardDescription className='line-clamp-2'>
                    {tournament.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='flex items-center text-gray-600'>
                      <Calendar className='w-4 h-4 mr-2' />
                      <span>{formatDate(tournament.tournament_start)}</span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <Trophy className='w-4 h-4 mr-2' />
                      <span>{formatPrize(tournament.prize_pool)}</span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <Users className='w-4 h-4 mr-2' />
                      <span>
                        {tournament.current_participants}/{tournament.max_participants}
                      </span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <DollarSign className='w-4 h-4 mr-2' />
                      <span className='text-green-600 font-semibold'>
                        {formatPrize(tournament.entry_fee)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='outline' size='sm' className='flex-1'>
                            <Eye className='w-4 h-4 mr-2' />
                            Xem
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{tournament.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Trạng thái</label>
                                <Badge className={getStatusColor(tournament.status)}>
                                  {getStatusText(tournament.status)}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Người tham gia</label>
                                <p>{tournament.current_participants}/{tournament.max_participants}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Mô tả</label>
                              <p className="text-gray-600">{tournament.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Bắt đầu</label>
                                <p>{formatDate(tournament.tournament_start)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Kết thúc</label>
                                <p>{formatDate(tournament.tournament_end)}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant='outline' size='sm' className='flex-1'>
                        <Edit className='w-4 h-4 mr-2' />
                        Sửa
                      </Button>
                    </div>

                    {/* Tournament Control Buttons */}
                    <div className='flex gap-2'>
                      {tournament.status === 'registration_open' && (
                        <>
                          <Button
                            onClick={() => handleStartTournament(tournament.id)}
                            size='sm'
                            className='flex-1'
                          >
                            <Play className='w-4 h-4 mr-2' />
                            Bắt đầu
                          </Button>
                          <Button
                            onClick={() => handleGenerateBracket(tournament.id)}
                            variant='outline'
                            size='sm'
                            className='flex-1'
                          >
                            <SquareCheckBig className='w-4 h-4 mr-2' />
                            Tạo bảng đấu
                          </Button>
                        </>
                      )}
                      
                      {tournament.status === 'ongoing' && (
                        <>
                          <Button
                            onClick={() => handlePauseTournament(tournament.id)}
                            variant='outline'
                            size='sm'
                            className='flex-1'
                          >
                            <Pause className='w-4 h-4 mr-2' />
                            Tạm dừng
                          </Button>
                          <Button
                            onClick={() => handleCompleteTournament(tournament.id)}
                            size='sm'
                            className='flex-1'
                          >
                            <SquareCheckBig className='w-4 h-4 mr-2' />
                            Hoàn thành
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <div className='text-center py-12'>
              <Trophy className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500 font-medium'>
                Không tìm thấy giải đấu nào
              </p>
              <p className='text-gray-400 text-sm mt-2'>
                Thử thay đổi bộ lọc hoặc tạo giải đấu mới
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách giải đấu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tên giải đấu</th>
                      <th className="text-left p-2">Trạng thái</th>
                      <th className="text-left p-2">Người tham gia</th>
                      <th className="text-left p-2">Giải thưởng</th>
                      <th className="text-left p-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTournaments.map(tournament => (
                      <tr key={tournament.id} className="border-b">
                        <td className="p-2">{tournament.name}</td>
                        <td className="p-2">
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusText(tournament.status)}
                          </Badge>
                        </td>
                        <td className="p-2">{tournament.current_participants}/{tournament.max_participants}</td>
                        <td className="p-2">{formatPrize(tournament.prize_pool)}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    filteredTournaments.reduce((acc, tournament) => {
                      acc[tournament.status] = (acc[tournament.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{getStatusText(status)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Thống kê giải thưởng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tổng giá trị giải thưởng</span>
                    <span className="font-medium">{formatPrize(realTimeStats.totalPrizePool)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Giải thưởng trung bình</span>
                    <span className="font-medium">
                      {formatPrize(realTimeStats.total > 0 ? realTimeStats.totalPrizePool / realTimeStats.total : 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTournamentManager;