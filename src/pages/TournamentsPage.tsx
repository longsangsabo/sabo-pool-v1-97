import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Plus, Calendar, MapPin, Users, Eye, Settings, Check, Clock, Radio } from 'lucide-react';
import { EnhancedTournamentCreator } from '@/components/tournament/EnhancedTournamentCreator';
import TournamentBroadcasting from '@/components/tournament/TournamentBroadcasting';
import { TournamentRegistrationDashboard } from '@/components/tournament/TournamentRegistrationDashboard';
import TournamentCard from '@/components/tournament/TournamentCard';
import { useTournaments } from '@/hooks/useTournaments';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeTournamentState } from '@/hooks/useRealTimeTournamentState';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import { useTournamentRegistrationFlow } from '@/hooks/useTournamentRegistrationFlow';
import { toast } from 'sonner';

const TournamentsPage: React.FC = () => {
  const { user } = useAuth();
  const { tournaments, loading, fetchTournaments } = useTournaments();
  const {
    loadRegistrationStatus,
    setRegistrationStatus,
    setLoadingState,
    isRegistered,
    isLoading,
    refreshTournamentStatus
  } = useRealTimeTournamentState();
  const { initializeRegistrationStatus } = useTournamentRegistrationFlow();
  
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'upcoming' | 'registration_open' | 'ongoing' | 'completed'
  >('all');
  const [showTournamentCreator, setShowTournamentCreator] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showRegistrationDashboard, setShowRegistrationDashboard] = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);

  // Enhanced real-time sync with better state management
  // TODO: Implement specific tournament sync when needed

  // Load user registrations using new hook
  useEffect(() => {
    if (!user || tournaments.length === 0) return;
    
    const tournamentIds = tournaments.map(t => t.id);
    loadRegistrationStatus(tournamentIds);
    initializeRegistrationStatus(tournamentIds);
  }, [user?.id, tournaments, loadRegistrationStatus, initializeRegistrationStatus]);

  const handleViewTournament = (tournamentId: string) => {
    // Navigate to tournament details page
    window.location.href = `/tournaments/${tournamentId}`;
  };

  const handleViewRegistrations = (tournament: any) => {
    setSelectedTournament(tournament);
    setShowRegistrationDashboard(true);
  };

  const updateRegistrationStatus = (tournamentId: string, isRegistered: boolean) => {
    console.log('Tournament registration state changed:', { tournamentId, isRegistered });
    setRegistrationStatus(tournamentId, isRegistered);
    fetchTournaments();
    if (isRegistered) {
      toast.success('Trạng thái đăng ký đã được cập nhật!');
    }
  };

  const handleTournamentCreated = (tournament: any) => {
    setShowTournamentCreator(false);
    toast.success('Giải đấu đã được tạo thành công!');
    fetchTournaments();
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'amateur':
        return 'bg-green-100 text-green-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'championship':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'amateur':
        return 'Nghiệp dư';
      case 'professional':
        return 'Chuyên nghiệp';
      case 'championship':
        return 'Vô địch';
      default:
        return category;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const filteredTournaments = tournaments?.filter(tournament => {
    if (selectedFilter === 'all') return true;
    return tournament.status === selectedFilter;
  }) || [];

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // Show Tournament Creator
  if (showTournamentCreator) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <EnhancedTournamentCreator 
            onSuccess={handleTournamentCreated}
            onCancel={() => setShowTournamentCreator(false)}
          />
        </div>
      </div>
    );
  }

  // Show Registration Dashboard
  if (showRegistrationDashboard && selectedTournament) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <TournamentRegistrationDashboard
            tournament={selectedTournament}
            onClose={() => setShowRegistrationDashboard(false)}
          />
        </div>
      </div>
    );
  }

  // Show Live Broadcast
  if (showLiveBroadcast) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowLiveBroadcast(false)}
              className="mb-4"
            >
              ← Back to Tournaments
            </Button>
          </div>
          <TournamentBroadcasting />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Giải đấu</h1>
              <p className='text-gray-600 mt-1'>
                Tham gia các giải đấu và thi đấu với người chơi khác
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLiveBroadcast(true)}
                className="flex items-center gap-2"
              >
                <Radio className="h-4 w-4 text-red-500" />
                Live Broadcast
              </Button>
              <Button onClick={() => setShowTournamentCreator(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Tạo giải đấu
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
              >
                Tất cả
              </Button>
              <Button
                variant={selectedFilter === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('upcoming')}
              >
                Sắp diễn ra
              </Button>
              <Button
                variant={selectedFilter === 'registration_open' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('registration_open')}
              >
                Đang mở đăng ký
              </Button>
              <Button
                variant={selectedFilter === 'ongoing' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('ongoing')}
              >
                Đang diễn ra
              </Button>
              <Button
                variant={selectedFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('completed')}
              >
                Đã kết thúc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tournaments Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredTournaments.map(tournament => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onView={handleViewTournament}
            />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className='text-center py-12'>
            <Trophy className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Không có giải đấu nào
            </h3>
            <p className='text-gray-600 mb-4'>
              {selectedFilter === 'all'
                ? 'Chưa có giải đấu nào được tạo'
                : `Không có giải đấu nào ở trạng thái "${getStatusName(selectedFilter)}"`}
            </p>
            <Button onClick={() => setShowTournamentCreator(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Tạo giải đấu đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
