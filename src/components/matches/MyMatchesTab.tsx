import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Trophy, Users, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MatchReportingModal } from './MatchReportingModal';
import { MatchVerificationCard } from './MatchVerificationCard';
import { toast } from 'sonner';

export const MyMatchesTab: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchMyMatches();
      fetchMyMatchResults();
    }
  }, [user]);

  const fetchMyMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          tournaments(name, status),
          player1:profiles!tournament_matches_player1_id_fkey(user_id, full_name, display_name),
          player2:profiles!tournament_matches_player2_id_fkey(user_id, full_name, display_name)
        `)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Có lỗi khi tải danh sách trận đấu');
    }
  };

  const fetchMyMatchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select(`
          *,
          player1:profiles!match_results_player1_id_fkey(user_id, full_name, display_name),
          player2:profiles!match_results_player2_id_fkey(user_id, full_name, display_name),
          tournament_match:tournament_matches(round_number, match_number)
        `)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatchResults(data || []);
    } catch (error) {
      console.error('Error fetching match results:', error);
      toast.error('Có lỗi khi tải kết quả trận đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleReportMatch = (match: any) => {
    setSelectedMatch(match);
    setShowReportModal(true);
  };

  const getMatchStatus = (match: any) => {
    const now = new Date();
    const scheduledTime = new Date(match.scheduled_time);
    
    if (match.status === 'completed') {
      return <Badge className="bg-green-500">Hoàn thành</Badge>;
    } else if (match.status === 'ongoing') {
      return <Badge className="bg-blue-500">Đang diễn ra</Badge>;
    } else if (scheduledTime < now) {
      return <Badge variant="destructive">Quá hạn</Badge>;
    } else {
      return <Badge variant="secondary">Chờ thi đấu</Badge>;
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = !searchQuery || 
      match.tournaments?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingResults = matchResults.filter(result => 
    result.result_status === 'pending_confirmation' || 
    (result.result_status === 'pending' && (!result.player1_confirmed || !result.player2_confirmed))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Trận Sắp Tới</TabsTrigger>
          <TabsTrigger value="pending">Chờ Xác Nhận ({pendingResults.length})</TabsTrigger>
          <TabsTrigger value="history">Lịch Sử</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên giải đấu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="ongoing">Đang diễn ra</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upcoming matches list */}
          <div className="space-y-4">
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có trận đấu nào sắp tới</p>
                </CardContent>
              </Card>
            ) : (
              filteredMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {match.tournaments?.name}
                      </CardTitle>
                      {getMatchStatus(match)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Vòng {match.round_number}, Trận {match.match_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(match.scheduled_time).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                      <div className="text-center flex-1">
                        <div className="font-medium">{match.player1?.full_name || 'TBD'}</div>
                        <div className="text-xs text-muted-foreground">Người chơi 1</div>
                        {user?.id === match.player1_id && (
                          <Badge variant="default" className="mt-1 text-xs">Bạn</Badge>
                        )}
                      </div>
                      <div className="text-center px-4">
                        <span className="text-xl font-bold text-muted-foreground">VS</span>
                      </div>
                      <div className="text-center flex-1">
                        <div className="font-medium">{match.player2?.full_name || 'TBD'}</div>
                        <div className="text-xs text-muted-foreground">Người chơi 2</div>
                        {user?.id === match.player2_id && (
                          <Badge variant="default" className="mt-1 text-xs">Bạn</Badge>
                        )}
                      </div>
                    </div>

                    {match.status === 'scheduled' && (
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => handleReportMatch(match)}
                          className="flex items-center gap-2"
                        >
                          <Trophy className="h-4 w-4" />
                          Báo Cáo Kết Quả
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {pendingResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có kết quả nào cần xác nhận</p>
                </CardContent>
              </Card>
            ) : (
              pendingResults.map((result) => (
                <MatchVerificationCard
                  key={result.id}
                  matchResult={result}
                  onVerificationChange={fetchMyMatchResults}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {matchResults.filter(r => r.result_status === 'verified').length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có lịch sử trận đấu nào</p>
                </CardContent>
              </Card>
            ) : (
              matchResults
                .filter(result => result.result_status === 'verified')
                .map((result) => (
                  <Card key={result.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                        <div className="text-center flex-1">
                          <div className="font-medium">{result.player1?.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ELO: {result.player1_elo_before} → {result.player1_elo_after}
                            <span className={result.player1_elo_change > 0 ? 'text-green-600' : 'text-red-600'}>
                              ({result.player1_elo_change > 0 ? '+' : ''}{result.player1_elo_change})
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center px-6">
                          <div className="text-2xl font-bold">
                            {result.player1_score} - {result.player2_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.match_date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        
                        <div className="text-center flex-1">
                          <div className="font-medium">{result.player2?.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ELO: {result.player2_elo_before} → {result.player2_elo_after}
                            <span className={result.player2_elo_change > 0 ? 'text-green-600' : 'text-red-600'}>
                              ({result.player2_elo_change > 0 ? '+' : ''}{result.player2_elo_change})
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Match Reporting Modal */}
      <MatchReportingModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedMatch(null);
        }}
        match={selectedMatch}
        onReportSubmitted={() => {
          fetchMyMatches();
          fetchMyMatchResults();
        }}
      />
    </div>
  );
};