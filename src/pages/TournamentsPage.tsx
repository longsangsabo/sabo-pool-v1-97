import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Plus, Calendar, MapPin, Users, Eye, Settings, Check, Clock, Radio } from 'lucide-react';
import { SimplifiedTournamentCreator } from '@/components/tournament/SimplifiedTournamentCreator';
import TournamentBroadcasting from '@/components/tournament/TournamentBroadcasting';
import { TournamentRegistrationDashboard } from '@/components/tournament/TournamentRegistrationDashboard';
import TournamentCard from '@/components/tournament/TournamentCard';
import { EnhancedTournamentCard } from '@/components/tournament/EnhancedTournamentCard';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentService } from '@/hooks/useTournamentService';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeTournamentState } from '@/hooks/useRealTimeTournamentState';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import { useTournamentRegistrationFlow } from '@/hooks/useTournamentRegistrationFlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { RankingService } from '@/services/rankingService';
import type { RankCode } from '@/utils/eloConstants';
import { toast } from 'sonner';

const TournamentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { tournaments, loading, fetchTournaments } = useTournaments();
  
  // Use new tournament service for enhanced functionality
  const {
    registerForTournament,
    cancelRegistration,
    calculateTournamentRewards,
    getAllTournamentRewards,
    checkUserRegistration,
    autoUpdateTournamentStatus,
    isRegistering,
    isCancelling
  } = useTournamentService();
  
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
      toast.success(t('tournament.registration_updated'));
    }
  };

  const handleTournamentRegister = async (tournamentId: string) => {
    try {
      await registerForTournament(tournamentId);
      updateRegistrationStatus(tournamentId, true);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleTournamentCreated = (tournament: any) => {
    setShowTournamentCreator(false);
    toast.success(t('tournament.created_success'));
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
        return t('tournament.status.upcoming');
      case 'registration_open':
        return t('tournament.status.registration_open');
      case 'registration_closed':
        return t('tournament.status.registration_closed');
      case 'ongoing':
        return t('tournament.status.ongoing');
      case 'completed':
        return t('tournament.status.completed');
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
        return t('tournament.category.amateur');
      case 'professional':
        return t('tournament.category.professional');
      case 'championship':
        return t('tournament.category.championship');
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
          <SimplifiedTournamentCreator 
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
              ← {t('tournament.back_to_tournaments')}
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
              <h1 className='text-3xl font-bold text-gray-900'>{t('tournament.page_title')}</h1>
              <p className='text-gray-600 mt-1'>
                {t('tournament.page_subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLiveBroadcast(true)}
                className="flex items-center gap-2"
              >
                <Radio className="h-4 w-4 text-red-500" />
                {t('tournament.live_broadcast')}
              </Button>
              <Button onClick={() => setShowTournamentCreator(true)}>
                <Plus className='h-4 w-4 mr-2' />
                {t('tournament.create_tournament')}
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
                {t('tournament.all')}
              </Button>
              <Button
                variant={selectedFilter === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('upcoming')}
              >
                {t('tournament.upcoming')}
              </Button>
              <Button
                variant={selectedFilter === 'registration_open' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('registration_open')}
              >
                {t('tournament.registration_open')}
              </Button>
              <Button
                variant={selectedFilter === 'ongoing' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('ongoing')}
              >
                {t('tournament.ongoing')}
              </Button>
              <Button
                variant={selectedFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('completed')}
              >
                {t('tournament.completed')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tournaments Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredTournaments.map(tournament => (
            <EnhancedTournamentCard
              key={tournament.id}
              tournament={tournament}
              playerRank={'K' as RankCode}
              onView={handleViewTournament}
              onRegister={handleTournamentRegister}
              isRegistered={isRegistered(tournament.id)}
            />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className='text-center py-12'>
            <Trophy className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {t('tournament.no_tournaments')}
            </h3>
            <p className='text-gray-600 mb-4'>
              {selectedFilter === 'all'
                ? t('tournament.no_tournaments_created')
                : `${t('tournament.no_tournaments_status')} "${getStatusName(selectedFilter)}"`}
            </p>
            <Button onClick={() => setShowTournamentCreator(true)}>
              <Plus className='h-4 w-4 mr-2' />
              {t('tournament.create_first')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
