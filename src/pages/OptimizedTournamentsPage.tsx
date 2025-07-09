/**
 * Enhanced TournamentsPage with Performance Optimizations
 * Implements virtualization, memoization, and optimized rendering
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Filter, Radio, Zap } from 'lucide-react';
import { SimplifiedTournamentCreator } from '@/components/tournament/SimplifiedTournamentCreator';
import { EnhancedTournamentForm } from '@/components/tournament/EnhancedTournamentForm';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import TournamentBroadcasting from '@/components/tournament/TournamentBroadcasting';
import { TournamentRegistrationDashboard } from '@/components/tournament/TournamentRegistrationDashboard';
import { VirtualizedTournamentList } from '@/components/tournament/VirtualizedTournamentList';
import { OptimizedTournamentCard } from '@/components/tournament/OptimizedTournamentCard';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentService } from '@/hooks/useTournamentService';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeTournamentState } from '@/hooks/useRealTimeTournamentState';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import { useTournamentRegistrationFlow } from '@/hooks/useTournamentRegistrationFlow';
import useTournamentOptimizations from '@/hooks/useTournamentOptimizations';
import { useLanguage } from '@/contexts/LanguageContext';
import { RankingService } from '@/services/rankingService';
import type { RankCode } from '@/utils/eloConstants';
import { toast } from 'sonner';
import { performanceMonitor, optimizationHelpers } from '@/utils/performance';

// Memoized filter component
const TournamentFilters = React.memo<{
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}>(({ selectedFilter, onFilterChange, searchQuery, onSearchChange }) => {
  const { t } = useLanguage();
  
  // Debounced search to optimize performance
  const debouncedSearch = useMemo(
    () => optimizationHelpers.debounce(onSearchChange, 300),
    [onSearchChange]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filters = useMemo(() => [
    { key: 'all', label: t('tournament.all') },
    { key: 'upcoming', label: t('tournament.upcoming') },
    { key: 'registration_open', label: t('tournament.registration_open') },
    { key: 'ongoing', label: t('tournament.ongoing') },
    { key: 'completed', label: t('tournament.completed') },
  ], [t]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('tournament.search_placeholder')}
              defaultValue={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TournamentFilters.displayName = 'TournamentFilters';

// Memoized stats component
const TournamentStats = React.memo<{
  totalTournaments: number;
  activeTournaments: number;
  userRegistrations: number;
}>(({ totalTournaments, activeTournaments, userRegistrations }) => {
  const { t } = useLanguage();

  const stats = useMemo(() => [
    {
      label: t('tournament.stats.total'),
      value: totalTournaments,
      icon: '🏆'
    },
    {
      label: t('tournament.stats.active'),
      value: activeTournaments,
      icon: '⚡'
    },
    {
      label: t('tournament.stats.registered'),
      value: userRegistrations,
      icon: '✅'
    }
  ], [totalTournaments, activeTournaments, userRegistrations, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

TournamentStats.displayName = 'TournamentStats';

const OptimizedTournamentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { tournaments, loading, fetchTournaments } = useTournaments();
  
  // Performance optimizations hook
  const {
    debouncedValidation,
    debouncedAutoSave,
    memoizeCalculation,
    measurePerformance,
    prefetchTournamentData,
    getPerformanceStats
  } = useTournamentOptimizations({
    debounceMs: 300,
    cacheSize: 100,
    enableMemoization: true,
    enablePrefetch: true
  });
  
  // Tournament service
  const {
    registerForTournament,
    cancelRegistration,
    isRegistering,
    isCancelling
  } = useTournamentService();
  
  // Real-time state management
  const {
    loadRegistrationStatus,
    setRegistrationStatus,
    isRegistered,
    isLoading: stateLoading,
  } = useRealTimeTournamentState();
  
  const { initializeRegistrationStatus } = useTournamentRegistrationFlow();
  
  // Local state
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTournamentCreator, setShowTournamentCreator] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showRegistrationDashboard, setShowRegistrationDashboard] = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);

  // Load registration status with optimization
  useEffect(() => {
    if (!user || tournaments.length === 0) return;
    
    measurePerformance('load-registration-status', () => {
      const tournamentIds = tournaments.map(t => t.id);
      loadRegistrationStatus(tournamentIds);
      initializeRegistrationStatus(tournamentIds);
    });
  }, [user?.id, tournaments, loadRegistrationStatus, initializeRegistrationStatus, measurePerformance]);

  // Memoized filtered tournaments with caching
  const filteredTournaments = useMemo(() => {
    return memoizeCalculation(`filtered-tournaments-${selectedFilter}-${searchQuery}`, () => {
      let filtered = tournaments || [];
      
      // Filter by status
      if (selectedFilter !== 'all') {
        filtered = filtered.filter(tournament => tournament.status === selectedFilter);
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(tournament => 
          tournament.name.toLowerCase().includes(query) ||
          tournament.description?.toLowerCase().includes(query) ||
          tournament.venue_address?.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    });
  }, [tournaments, selectedFilter, searchQuery, memoizeCalculation]);

  // Memoized statistics
  const tournamentStats = useMemo(() => {
    return memoizeCalculation('tournament-stats', () => ({
      totalTournaments: tournaments?.length || 0,
      activeTournaments: tournaments?.filter(t => 
        ['registration_open', 'ongoing'].includes(t.status)
      ).length || 0,
      userRegistrations: tournaments?.filter(t => 
        user && isRegistered(t.id)
      ).length || 0
    }));
  }, [tournaments, user, isRegistered, memoizeCalculation]);

  // Optimized callbacks
  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
    
    // Prefetch data for the new filter if needed
    if (filter === 'ongoing') {
      const ongoingTournaments = tournaments?.filter(t => t.status === 'ongoing') || [];
      ongoingTournaments.forEach(t => prefetchTournamentData(t.id));
    }
  }, [tournaments, prefetchTournamentData]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleViewTournament = useCallback((tournamentId: string) => {
    // Prefetch tournament data before navigation
    prefetchTournamentData(tournamentId);
    
    // Navigate with optimized transition
    setTimeout(() => {
      window.location.href = `/tournaments/${tournamentId}`;
    }, 100);
  }, [prefetchTournamentData]);

  const handleTournamentRegister = useCallback(async (tournamentId: string) => {
    try {
      await measurePerformance('tournament-registration', async () => {
        await registerForTournament(tournamentId);
        setRegistrationStatus(tournamentId, true);
        fetchTournaments();
        toast.success(t('tournament.registration_updated'));
      });
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(t('tournament.registration_failed'));
    }
  }, [registerForTournament, setRegistrationStatus, fetchTournaments, t, measurePerformance]);

  const handleTournamentCreated = useCallback((tournament: any) => {
    setShowTournamentCreator(false);
    toast.success(t('tournament.created_success'));
    fetchTournaments();
  }, [fetchTournaments, t]);

  // Display performance stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('Tournament Page Performance:', getPerformanceStats());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [getPerformanceStats]);

  if (loading && tournaments.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Show Tournament Creator
  if (showTournamentCreator) {
    return (
      <ProfileProvider>
        <TournamentProvider>
          <div className='min-h-screen bg-background'>
            <div className='max-w-7xl mx-auto px-4 py-6'>
              <EnhancedTournamentForm 
                onSuccess={handleTournamentCreated}
                onCancel={() => setShowTournamentCreator(false)}
              />
            </div>
          </div>
        </TournamentProvider>
      </ProfileProvider>
    );
  }

  // Show Registration Dashboard
  if (showRegistrationDashboard && selectedTournament) {
    return (
      <div className='min-h-screen bg-background'>
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
      <div className='min-h-screen bg-background'>
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
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-foreground flex items-center gap-2'>
                <Zap className="h-8 w-8 text-primary" />
                {t('tournament.page_title')}
              </h1>
              <p className='text-muted-foreground mt-1'>
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

        {/* Statistics */}
        <TournamentStats {...tournamentStats} />

        {/* Filters */}
        <div className="mb-6">
          <TournamentFilters
            selectedFilter={selectedFilter}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Tournament List - Use virtualization for large lists */}
        {filteredTournaments.length > 12 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Danh sách giải đấu (Tối ưu hóa)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualizedTournamentList
                tournaments={filteredTournaments}
                onTournamentClick={handleViewTournament}
                onRegister={handleTournamentRegister}
                isRegistered={isRegistered}
                loading={loading}
                height={800}
              />
            </CardContent>
          </Card>
        ) : (
          /* Traditional grid for smaller lists */
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredTournaments.map((tournament, index) => (
              <OptimizedTournamentCard
                key={tournament.id}
                tournament={tournament}
                playerRank={'K' as RankCode}
                onView={handleViewTournament}
                onRegister={handleTournamentRegister}
                isRegistered={isRegistered(tournament.id)}
                priority={index < 6 ? 'high' : 'medium'}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredTournaments.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className='text-center'>
                <div className="text-6xl mb-4">🏆</div>
                <h3 className='text-lg font-medium text-foreground mb-2'>
                  {t('tournament.no_tournaments')}
                </h3>
                <p className='text-muted-foreground mb-4'>
                  {selectedFilter === 'all'
                    ? t('tournament.no_tournaments_created')
                    : `${t('tournament.no_tournaments_status')} "${selectedFilter}"`}
                </p>
                <Button onClick={() => setShowTournamentCreator(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  {t('tournament.create_first')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OptimizedTournamentsPage;