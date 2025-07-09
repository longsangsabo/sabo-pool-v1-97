import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Search, 
  Filter,
  TrendingUp,
  Award,
  Target,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardPlayer {
  player_id: string;
  full_name: string;
  display_name: string;
  current_rank: string;
  spa_points: number;
  total_matches: number;
  wins: number;
  position: number;
  change?: number; // Change from previous position
}

const getRankIcon = (position: number) => {
  if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (position === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  if (position <= 10) return <Star className="h-4 w-4 text-blue-500" />;
  return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
};

const getRankColor = (position: number) => {
  if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
  if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
  if (position === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
  if (position <= 10) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
  return 'bg-muted';
};

export function EnhancedSPALeaderboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Fetch leaderboard data
  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ['spa-leaderboard', rankFilter, timeFilter],
    queryFn: async () => {
      let query = supabase
        .from('player_rankings')
        .select(`
          player_id,
          spa_points,
          total_matches,
          wins,
          profiles!inner(
            full_name,
            display_name,
            current_rank
          )
        `)
        .gt('spa_points', 0);

      // Apply rank filter
      if (rankFilter !== 'all') {
        query = query.eq('profiles.current_rank', rankFilter);
      }

      const { data } = await query.order('spa_points', { ascending: false });

      return data?.map((item, index) => ({
        player_id: item.player_id,
        full_name: (item.profiles as any)?.full_name || 'Unknown',
        display_name: (item.profiles as any)?.display_name || 'Unknown',
        current_rank: (item.profiles as any)?.current_rank || 'Unranked',
        spa_points: item.spa_points,
        total_matches: item.total_matches || 0,
        wins: item.wins || 0,
        position: index + 1,
        change: Math.floor(Math.random() * 10) - 5 // Mock change data
      })) as LeaderboardPlayer[] || [];
    }
  });

  const filteredLeaderboard = leaderboard?.filter(player =>
    player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get stats for overview
  const totalPlayers = leaderboard?.length || 0;
  const averageSPA = leaderboard?.reduce((sum, p) => sum + p.spa_points, 0) / totalPlayers || 0;
  const topPlayer = leaderboard?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Bảng xếp hạng SPA</h2>
        <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng người chơi</p>
                <p className="text-3xl font-bold text-foreground">{totalPlayers}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SPA trung bình</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(averageSPA).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dẫn đầu</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {topPlayer?.full_name || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topPlayer?.spa_points.toLocaleString() || 0} SPA
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Tổng thể</TabsTrigger>
          <TabsTrigger value="monthly">Tháng này</TabsTrigger>
          <TabsTrigger value="weekly">Tuần này</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người chơi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng</SelectItem>
                <SelectItem value="E">Hạng E</SelectItem>
                <SelectItem value="F">Hạng F</SelectItem>
                <SelectItem value="G">Hạng G</SelectItem>
                <SelectItem value="H">Hạng H</SelectItem>
                <SelectItem value="I">Hạng I</SelectItem>
                <SelectItem value="K">Hạng K</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Xếp hạng SPA Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Đang tải bảng xếp hạng...</p>
                </div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy người chơi nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Hạng</TableHead>
                      <TableHead>Người chơi</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead className="text-center">Trận đấu</TableHead>
                      <TableHead className="text-center">Thắng</TableHead>
                      <TableHead className="text-right">SPA Points</TableHead>
                      <TableHead className="text-center">Thay đổi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaderboard.map((player) => (
                      <TableRow 
                        key={player.player_id}
                        className={player.position <= 3 ? 'bg-muted/30' : ''}
                      >
                        <TableCell>
                          <div className={`flex items-center justify-center p-2 rounded-lg ${getRankColor(player.position)}`}>
                            {getRankIcon(player.position)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{player.full_name}</p>
                            <p className="text-sm text-muted-foreground">{player.display_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {player.current_rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {player.total_matches}
                        </TableCell>
                        <TableCell className="text-center">
                          {player.wins}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-lg">
                              {player.spa_points.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">SPA</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {player.change !== undefined && (
                            <div className={`flex items-center justify-center gap-1 ${
                              player.change > 0 ? 'text-green-600' :
                              player.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                              {player.change > 0 && <TrendingUp className="h-3 w-3" />}
                              {player.change < 0 && <TrendingUp className="h-3 w-3 rotate-180" />}
                              <span className="text-xs font-medium">
                                {player.change > 0 ? '+' : ''}{player.change}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Bảng xếp hạng tháng này đang được phát triển</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Bảng xếp hạng tuần này đang được phát triển</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}