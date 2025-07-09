/**
 * Virtualized Tournament List Component
 * Optimizes rendering of large tournament lists using react-window
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { useLanguage } from '@/contexts/LanguageContext';
import { performanceMonitor } from '@/utils/performance';

interface VirtualizedTournamentListProps {
  tournaments: Tournament[];
  onTournamentClick: (tournamentId: string) => void;
  onRegister: (tournamentId: string) => void;
  isRegistered: (tournamentId: string) => boolean;
  loading?: boolean;
  hasNextPage?: boolean;
  loadNextPage?: () => Promise<void>;
  height?: number;
}

// Memoized Tournament Card Component
const TournamentListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    tournaments: Tournament[];
    onTournamentClick: (id: string) => void;
    onRegister: (id: string) => void;
    isRegistered: (id: string) => boolean;
    t: (key: string) => string;
  };
}>(({ index, style, data }) => {
  const { tournaments, onTournamentClick, onRegister, isRegistered, t } = data;
  const tournament = tournaments[index];

  // Memoized calculations
  const statusColor = useMemo(() => {
    switch (tournament?.status) {
      case 'registration_open': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'upcoming': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'ongoing': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'completed': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  }, [tournament?.status]);

  const prizeFormatted = useMemo(() => 
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact'
    }).format(tournament?.prize_pool || 0),
    [tournament?.prize_pool]
  );

  const participantsPercentage = useMemo(() => 
    Math.round(((tournament?.current_participants || 0) / (tournament?.max_participants || 1)) * 100),
    [tournament?.current_participants, tournament?.max_participants]
  );

  const isUserRegistered = useMemo(() => 
    tournament ? isRegistered(tournament.id) : false,
    [tournament?.id, isRegistered]
  );

  // Memoized callbacks
  const handleClick = useCallback(() => {
    if (tournament?.id) {
      // Simple performance tracking
      const start = performance.now();
      onTournamentClick(tournament.id);
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`Tournament navigation took ${end - start}ms`);
      }
    }
  }, [tournament?.id, onTournamentClick]);

  const handleRegister = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (tournament?.id) {
      onRegister(tournament.id);
    }
  }, [tournament?.id, onRegister]);

  if (!tournament) {
    return (
      <div style={style} className="p-2">
        <Card className="h-full">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={style} className="p-2">
      <Card 
        className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border"
        onClick={handleClick}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate mb-1">
                {tournament.name}
              </h3>
              <Badge variant="outline" className={statusColor}>
                {t(`tournament.status.${tournament.status}`)}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground ml-2">
              <Trophy className="h-4 w-4 mr-1" />
              {prizeFormatted}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {new Date(tournament.tournament_start).toLocaleDateString('vi-VN')}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{tournament.venue_address || 'Chưa xác định'}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {tournament.current_participants}/{tournament.max_participants} 
                <span className="ml-1">({participantsPercentage}%)</span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {tournament.tournament_type === 'single_elimination' ? 'Loại trực tiếp' : 
               tournament.tournament_type === 'round_robin' ? 'Vòng tròn' : 'Khác'}
            </div>
            
            <Button
              size="sm"
              variant={isUserRegistered ? "outline" : "default"}
              onClick={handleRegister}
              disabled={tournament.status !== 'registration_open'}
              className="min-w-[80px]"
            >
              {isUserRegistered ? t('tournament.registered') : t('tournament.register')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TournamentListItem.displayName = 'TournamentListItem';

// Main Virtualized List Component
export const VirtualizedTournamentList = memo<VirtualizedTournamentListProps>(({
  tournaments,
  onTournamentClick,
  onRegister,
  isRegistered,
  loading = false,
  hasNextPage = false,
  loadNextPage,
  height = 600
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Memoized item data
  const itemData = useMemo(() => ({
    tournaments,
    onTournamentClick,
    onRegister,
    isRegistered,
    t
  }), [tournaments, onTournamentClick, onRegister, isRegistered, t]);

  // Load more items for infinite scrolling
  const loadMoreItems = useCallback(async () => {
    if (isLoading || !loadNextPage) return;
    
    setIsLoading(true);
    try {
      await loadNextPage();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadNextPage]);

  // Check if item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !!tournaments[index];
  }, [tournaments]);

  // Calculate total item count (add buffer for loading)
  const itemCount = hasNextPage ? tournaments.length + 1 : tournaments.length;

  if (loading && tournaments.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[280px]">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full">
      {loadNextPage ? (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={height}
              itemCount={itemCount}
              itemSize={300} // Height of each tournament card + padding
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              overscanCount={2} // Render 2 extra items outside visible area
              className="tournament-list"
            >
              {TournamentListItem}
            </List>
          )}
        </InfiniteLoader>
      ) : (
        <List
          height={height}
          itemCount={tournaments.length}
          itemSize={300}
          itemData={itemData}
          overscanCount={2}
          className="tournament-list"
        >
          {TournamentListItem}
        </List>
      )}
    </div>
  );
});

VirtualizedTournamentList.displayName = 'VirtualizedTournamentList';