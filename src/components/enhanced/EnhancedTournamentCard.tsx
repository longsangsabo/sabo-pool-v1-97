import React, { memo, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LazyImage } from '@/components/lazy/LazyImage';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  Star,
  DollarSign,
  Eye,
  UserPlus
} from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { RankCode } from '@/utils/eloConstants';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EnhancedTournamentCardProps {
  tournament: Tournament;
  playerRank?: RankCode;
  onView?: (tournamentId: string) => void;
  onRegister?: (tournamentId: string) => void;
  isRegistered?: boolean;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  index?: number; // For staggered animations
}

// Memoized status badge component
const StatusBadge = memo<{ status: string; className?: string }>(({ status, className }) => {
  const { t } = useLanguage();
  
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'registration_open':
        return {
          className: 'bg-green-500/10 text-green-700 border-green-200',
          label: t('tournament.status.registration_open')
        };
      case 'upcoming':
        return {
          className: 'bg-blue-500/10 text-blue-700 border-blue-200',
          label: t('tournament.status.upcoming')
        };
      case 'ongoing':
        return {
          className: 'bg-purple-500/10 text-purple-700 border-purple-200',
          label: t('tournament.status.ongoing')
        };
      case 'completed':
        return {
          className: 'bg-gray-500/10 text-gray-700 border-gray-200',
          label: t('tournament.status.completed')
        };
      default:
        return {
          className: 'bg-gray-500/10 text-gray-700 border-gray-200',
          label: status
        };
    }
  }, [status, t]);

  return (
    <Badge variant="outline" className={cn(statusConfig.className, className)}>
      {statusConfig.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized prize display component
const PrizeDisplay = memo<{ amount: number; className?: string }>(({ amount, className }) => {
  const formattedPrize = useMemo(() => 
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 0
    }).format(amount),
    [amount]
  );

  return (
    <div className={cn("flex items-center text-sm font-medium text-primary", className)}>
      <Trophy className="h-4 w-4 mr-1" />
      {formattedPrize}
    </div>
  );
});

PrizeDisplay.displayName = 'PrizeDisplay';

// Memoized participants progress component
const ParticipantsProgress = memo<{ 
  current: number; 
  max: number; 
  className?: string;
}>(({ current, max, className }) => {
  const percentage = useMemo(() => Math.round((current / max) * 100), [current, max]);
  
  const progressColor = useMemo(() => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [percentage]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          Người tham gia
        </div>
        <span className="font-medium">{current}/{max}</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 transition-all duration-300"
      />
    </div>
  );
});

ParticipantsProgress.displayName = 'ParticipantsProgress';

// Memoized date display component
const DateDisplay = memo<{ 
  date: string; 
  label?: string;
  className?: string;
}>(({ date, label = "Ngày bắt đầu", className }) => {
  const formattedDate = useMemo(() => 
    new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    [date]
  );

  const formattedTime = useMemo(() => 
    new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    [date]
  );

  return (
    <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
      <div>
        <div>{formattedDate}</div>
        <div className="text-xs opacity-75">{formattedTime}</div>
      </div>
    </div>
  );
});

DateDisplay.displayName = 'DateDisplay';

// Main enhanced tournament card
export const EnhancedTournamentCard = memo<EnhancedTournamentCardProps>(({
  tournament,
  playerRank,
  onView,
  onRegister,
  isRegistered = false,
  className,
  priority = 'medium',
  index = 0
}) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  // Memoized calculations
  const canRegister = useMemo(() => 
    tournament.status === 'registration_open' && 
    tournament.current_participants < tournament.max_participants && 
    !isRegistered,
    [tournament.status, tournament.current_participants, tournament.max_participants, isRegistered]
  );

  const tournamentType = useMemo(() => {
    switch (tournament.tournament_type) {
      case 'single_elimination': return 'Loại trực tiếp';
      case 'double_elimination': return 'Loại kép';
      case 'round_robin': return 'Vòng tròn';
      case 'swiss': return 'Swiss';
      default: return tournament.tournament_type;
    }
  }, [tournament.tournament_type]);

  const gameFormat = useMemo(() => {
    switch (tournament.game_format) {
      case '8_ball': return '8-Ball';
      case '9_ball': return '9-Ball';
      case '10_ball': return '10-Ball';
      case 'straight_pool': return 'Straight Pool';
      default: return tournament.game_format;
    }
  }, [tournament.game_format]);

  // Optimized callbacks
  const handleView = useCallback(() => {
    onView?.(tournament.id);
  }, [onView, tournament.id]);

  const handleRegister = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRegister?.(tournament.id);
  }, [onRegister, tournament.id]);

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-500 hover:shadow-xl border",
        "hover:border-primary/20 overflow-hidden animate-slide-in-up",
        isHovered && "scale-105 shadow-2xl",
        className
      )}
      onClick={handleView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animationDelay: `${index * 100}ms`,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0px)'
      }}
    >
      {/* Banner Image */}
      {tournament.banner_image && (
        <div className="relative h-48 overflow-hidden bg-muted">
          <LazyImage
            src={tournament.banner_image}
            alt={tournament.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority={priority === 'high'}
          />
          
          {/* Status badge overlay */}
          <div className="absolute top-4 left-4 animate-fade-in">
            <StatusBadge status={tournament.status} />
          </div>
          
          {/* Prize overlay */}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1 animate-fade-in">
            <PrizeDisplay amount={tournament.prize_pool} />
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {tournament.name}
            </h3>
            {tournament.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {tournament.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tournament Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-muted-foreground transition-colors duration-200 hover:text-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {tournamentType}
          </div>
          <div className="flex items-center text-muted-foreground transition-colors duration-200 hover:text-foreground">
            <Star className="h-4 w-4 mr-2" />
            {gameFormat}
          </div>
        </div>

        {/* Date and Location */}
        <DateDisplay date={tournament.tournament_start} />
        
        {tournament.venue_address && (
          <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{tournament.venue_address}</span>
          </div>
        )}

        {/* Entry Fee */}
        {tournament.entry_fee > 0 && (
          <div className="flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>
              Phí tham gia: {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(tournament.entry_fee)}
            </span>
          </div>
        )}

        {/* Participants Progress */}
        <ParticipantsProgress 
          current={tournament.current_participants}
          max={tournament.max_participants}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1 hover-scale transition-all duration-200"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t('tournament.view_details')}
          </Button>
          
          {canRegister && (
            <Button
              size="sm"
              onClick={handleRegister}
              className="flex-1 hover-scale transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {t('tournament.register')}
            </Button>
          )}
          
          {isRegistered && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1 border-green-200 text-green-700"
            >
              ✓ {t('tournament.registered')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EnhancedTournamentCard.displayName = 'EnhancedTournamentCard';