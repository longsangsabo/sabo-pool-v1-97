import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Tv, 
  Radio, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  Maximize,
  Play,
  Pause,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LiveTournament {
  id: string;
  name: string;
  status: string;
  current_round: number;
  total_rounds: number;
  viewers: number;
  is_live: boolean;
  stream_url?: string;
  featured_match?: {
    player1: string;
    player2: string;
    score1: number;
    score2: number;
    current_frame: number;
    total_frames: number;
  };
}

interface LiveUpdate {
  id: string;
  tournament_id: string;
  type: 'match_start' | 'score_update' | 'match_end' | 'round_complete';
  message: string;
  timestamp: Date;
  data: any;
}

const TournamentBroadcasting: React.FC = () => {
  const [liveTournaments, setLiveTournaments] = useState<LiveTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isStreamMuted, setIsStreamMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch live tournaments
  const fetchLiveTournaments = async () => {
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          id, name, status, 
          tournament_brackets(total_rounds),
          live_streams(stream_url, viewer_count, status)
        `)
        .in('status', ['ongoing', 'live']);

      if (error) throw error;

      const mockLiveData: LiveTournament[] = tournaments?.map((t, index) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        current_round: Math.floor(Math.random() * 3) + 1,
        total_rounds: t.tournament_brackets?.[0]?.total_rounds || 4,
        viewers: Math.floor(Math.random() * 500) + 50,
        is_live: index < 2, // Mock: first 2 tournaments are live
        stream_url: index === 0 ? 'https://example.com/stream' : undefined,
        featured_match: index === 0 ? {
          player1: 'Nguyễn Văn A',
          player2: 'Trần Thị B',
          score1: Math.floor(Math.random() * 5),
          score2: Math.floor(Math.random() * 5),
          current_frame: Math.floor(Math.random() * 8) + 1,
          total_frames: 9
        } : undefined
      })) || [];

      setLiveTournaments(mockLiveData);
      if (mockLiveData.length > 0 && !selectedTournament) {
        setSelectedTournament(mockLiveData[0].id);
      }
    } catch (error) {
      console.error('Error fetching live tournaments:', error);
      toast.error('Lỗi khi tải giải đấu trực tiếp');
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('tournament-live-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches'
        },
        (payload) => {
          const newUpdate: LiveUpdate = {
            id: Math.random().toString(),
            tournament_id: (payload.new as any)?.tournament_id || '',
            type: 'score_update',
            message: 'Cập nhật tỷ số mới',
            timestamp: new Date(),
            data: payload.new
          };
          setLiveUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const presenceState = channel.presenceState();
          setViewerCount(Object.keys(presenceState).length);
        }
      )
      .subscribe();

    // Join as viewer
    channel.track({ user_id: Math.random().toString(), joined_at: new Date().toISOString() });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Periodic updates
  useEffect(() => {
    fetchLiveTournaments();
    const interval = setInterval(() => {
      // Simulate live updates
      const mockUpdate: LiveUpdate = {
        id: Math.random().toString(),
        tournament_id: selectedTournament || '',
        type: Math.random() > 0.5 ? 'score_update' : 'match_start',
        message: Math.random() > 0.5 ? 'Cập nhật tỷ số: 3-2' : 'Trận đấu mới bắt đầu',
        timestamp: new Date(),
        data: {}
      };
      setLiveUpdates(prev => [mockUpdate, ...prev.slice(0, 9)]);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedTournament]);

  const selectedTournamentData = liveTournaments.find(t => t.id === selectedTournament);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Live: ${selectedTournamentData?.name}`,
        text: 'Đang xem giải đấu trực tiếp tại SABO POOL',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép link chia sẻ');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold">Tournament Live Broadcast</h2>
          <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-lg font-semibold">{viewerCount}</span>
          <span className="text-sm text-muted-foreground">viewers</span>
        </div>
      </div>

      {/* Live Tournament Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {liveTournaments.map((tournament) => (
          <Card 
            key={tournament.id} 
            className={`cursor-pointer transition-all duration-200 ${
              selectedTournament === tournament.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedTournament(tournament.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold truncate">{tournament.name}</h3>
                {tournament.is_live && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-500 font-medium">LIVE</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Round {tournament.current_round}/{tournament.total_rounds}</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{tournament.viewers}</span>
                  </div>
                </div>
                <Progress 
                  value={(tournament.current_round / tournament.total_rounds) * 100} 
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTournamentData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Stream */}
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-gray-900 aspect-video rounded-lg overflow-hidden">
                  {selectedTournamentData.stream_url ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Tv className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Live Stream</p>
                        <p className="text-sm opacity-75">
                          {selectedTournamentData.featured_match?.player1} vs {selectedTournamentData.featured_match?.player2}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Radio className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Audio Commentary</p>
                        <p className="text-sm opacity-75">Live match updates</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Stream Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-black/50 hover:bg-black/70"
                        onClick={() => setIsStreamMuted(!isStreamMuted)}
                      >
                        {isStreamMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="bg-black/50 hover:bg-black/70"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Match Info */}
            {selectedTournamentData.featured_match && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Featured Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <div className="text-lg font-semibold">
                        {selectedTournamentData.featured_match.player1}
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {selectedTournamentData.featured_match.score1}
                      </div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-sm text-muted-foreground">vs</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-semibold">
                        {selectedTournamentData.featured_match.player2}
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {selectedTournamentData.featured_match.score2}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Frame {selectedTournamentData.featured_match.current_frame} of {selectedTournamentData.featured_match.total_frames}
                  </div>
                  <Progress 
                    value={(selectedTournamentData.featured_match.current_frame / selectedTournamentData.featured_match.total_frames) * 100}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            )}

            {/* Stream Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-1">
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Live Updates Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {liveUpdates.map((update) => (
                    <div key={update.id} className="border-b last:border-b-0 p-4">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {update.timestamp.toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tournament Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Viewers</span>
                  <span className="font-semibold">{selectedTournamentData.viewers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Round</span>
                  <span className="font-semibold">
                    {selectedTournamentData.current_round}/{selectedTournamentData.total_rounds}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={selectedTournamentData.is_live ? "destructive" : "secondary"}>
                    {selectedTournamentData.is_live ? 'LIVE' : 'UPCOMING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBroadcasting;