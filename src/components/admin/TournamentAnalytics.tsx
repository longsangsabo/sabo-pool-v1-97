import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  DollarSign,
  Clock,
  Target,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsData {
  tournaments: {
    total: number;
    completed: number;
    ongoing: number;
    cancelled: number;
    completion_rate: number;
  };
  participants: {
    total_unique: number;
    avg_per_tournament: number;
    repeat_participants: number;
    new_participants: number;
  };
  financial: {
    total_revenue: number;
    avg_entry_fee: number;
    total_prizes: number;
    profit_margin: number;
  };
  performance: {
    avg_duration: number;
    completion_rate: number;
    participant_satisfaction: number;
    dispute_rate: number;
  };
}

interface TrendData {
  period: string;
  tournaments: number;
  participants: number;
  revenue: number;
}

const TournamentAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    tournaments: { total: 0, completed: 0, ongoing: 0, cancelled: 0, completion_rate: 0 },
    participants: { total_unique: 0, avg_per_tournament: 0, repeat_participants: 0, new_participants: 0 },
    financial: { total_revenue: 0, avg_entry_fee: 0, total_prizes: 0, profit_margin: 0 },
    performance: { avg_duration: 0, completion_rate: 0, participant_satisfaction: 0, dispute_rate: 0 }
  });
  
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchTrendData();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament statistics
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*');

      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('*');

      // Calculate analytics data
      const totalTournaments = tournaments?.length || 0;
      const completedTournaments = tournaments?.filter(t => t.status === 'completed').length || 0;
      const ongoingTournaments = tournaments?.filter(t => t.status === 'ongoing').length || 0;
      const cancelledTournaments = tournaments?.filter(t => t.status === 'cancelled').length || 0;
      
      const uniqueParticipants = new Set(registrations?.map(r => r.player_id)).size;
      const avgParticipants = totalTournaments > 0 ? (registrations?.length || 0) / totalTournaments : 0;
      
      // Mock some financial data for demo
      const totalRevenue = tournaments?.reduce((sum, t) => sum + (t.entry_fee || 0), 0) || 0;
      const avgEntryFee = totalTournaments > 0 ? totalRevenue / totalTournaments : 0;
      const totalPrizes = tournaments?.reduce((sum, t) => sum + (t.prize_pool || 0), 0) || 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalPrizes) / totalRevenue) * 100 : 0;

      setAnalytics({
        tournaments: {
          total: totalTournaments,
          completed: completedTournaments,
          ongoing: ongoingTournaments,
          cancelled: cancelledTournaments,
          completion_rate: totalTournaments > 0 ? (completedTournaments / totalTournaments) * 100 : 0
        },
        participants: {
          total_unique: uniqueParticipants,
          avg_per_tournament: Math.round(avgParticipants * 10) / 10,
          repeat_participants: Math.floor(uniqueParticipants * 0.3), // Mock data
          new_participants: Math.floor(uniqueParticipants * 0.7) // Mock data
        },
        financial: {
          total_revenue: totalRevenue,
          avg_entry_fee: Math.round(avgEntryFee),
          total_prizes: totalPrizes,
          profit_margin: Math.round(profitMargin * 10) / 10
        },
        performance: {
          avg_duration: 2.5, // Mock: average hours
          completion_rate: totalTournaments > 0 ? (completedTournaments / totalTournaments) * 100 : 0,
          participant_satisfaction: 4.3, // Mock rating
          dispute_rate: 5.2 // Mock percentage
        }
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Lỗi khi tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      // Mock trend data for the chart
      const mockTrends: TrendData[] = [
        { period: 'Week 1', tournaments: 12, participants: 156, revenue: 2400000 },
        { period: 'Week 2', tournaments: 15, participants: 198, revenue: 3200000 },
        { period: 'Week 3', tournaments: 18, participants: 234, revenue: 3800000 },
        { period: 'Week 4', tournaments: 21, participants: 278, revenue: 4200000 },
        { period: 'Week 5', tournaments: 16, participants: 205, revenue: 3600000 },
        { period: 'Week 6', tournaments: 24, participants: 312, revenue: 4800000 }
      ];
      
      setTrendData(mockTrends);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const exportData = () => {
    const csvContent = `
Tournament Analytics Report
Generated: ${new Date().toLocaleString('vi-VN')}

Tournaments:
Total: ${analytics.tournaments.total}
Completed: ${analytics.tournaments.completed}
Ongoing: ${analytics.tournaments.ongoing}
Cancelled: ${analytics.tournaments.cancelled}
Completion Rate: ${analytics.tournaments.completion_rate}%

Participants:
Total Unique: ${analytics.participants.total_unique}
Average per Tournament: ${analytics.participants.avg_per_tournament}
Repeat Participants: ${analytics.participants.repeat_participants}
New Participants: ${analytics.participants.new_participants}

Financial:
Total Revenue: ${analytics.financial.total_revenue.toLocaleString('vi-VN')} VND
Average Entry Fee: ${analytics.financial.avg_entry_fee.toLocaleString('vi-VN')} VND
Total Prizes: ${analytics.financial.total_prizes.toLocaleString('vi-VN')} VND
Profit Margin: ${analytics.financial.profit_margin}%

Performance:
Average Duration: ${analytics.performance.avg_duration} hours
Completion Rate: ${analytics.performance.completion_rate}%
Participant Satisfaction: ${analytics.performance.participant_satisfaction}/5
Dispute Rate: ${analytics.performance.dispute_rate}%
    `;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Analytics data exported successfully');
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
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Analytics</h2>
          <p className="text-muted-foreground">Comprehensive tournament performance insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tournaments</p>
                <p className="text-2xl font-bold">{analytics.tournaments.total}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% vs last month</span>
                </div>
              </div>
              <Trophy className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{analytics.participants.total_unique}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8% vs last month</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {analytics.financial.total_revenue.toLocaleString('vi-VN')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+15% vs last month</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.tournaments.completion_rate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">-2% vs last month</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournament Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tournament Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Completed</Badge>
                  <span className="text-sm">{analytics.tournaments.completed} tournaments</span>
                </div>
                <span className="font-medium">
                  {((analytics.tournaments.completed / analytics.tournaments.total) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Ongoing</Badge>
                  <span className="text-sm">{analytics.tournaments.ongoing} tournaments</span>
                </div>
                <span className="font-medium">
                  {((analytics.tournaments.ongoing / analytics.tournaments.total) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Cancelled</Badge>
                  <span className="text-sm">{analytics.tournaments.cancelled} tournaments</span>
                </div>
                <span className="font-medium">
                  {((analytics.tournaments.cancelled / analytics.tournaments.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Entry Fee</span>
                <span className="font-medium">
                  {analytics.financial.avg_entry_fee.toLocaleString('vi-VN')} VND
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Prize Pool</span>
                <span className="font-medium">
                  {analytics.financial.total_prizes.toLocaleString('vi-VN')} VND
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Profit Margin</span>
                <span className="font-medium text-green-600">
                  {analytics.financial.profit_margin}%
                </span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Net Revenue</span>
                  <span className="font-bold text-green-600">
                    {(analytics.financial.total_revenue - analytics.financial.total_prizes).toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participant Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Participant Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg per Tournament</span>
                <span className="font-medium">{analytics.participants.avg_per_tournament}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Repeat Participants</span>
                <span className="font-medium">{analytics.participants.repeat_participants}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New Participants</span>
                <span className="font-medium">{analytics.participants.new_participants}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Retention Rate</span>
                  <span className="font-bold text-blue-600">
                    {((analytics.participants.repeat_participants / analytics.participants.total_unique) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Tournament Duration</span>
                <span className="font-medium">{analytics.performance.avg_duration}h</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Participant Satisfaction</span>
                <span className="font-medium">{analytics.performance.participant_satisfaction}/5 ⭐</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dispute Rate</span>
                <span className="font-medium text-yellow-600">{analytics.performance.dispute_rate}%</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Overall Health Score</span>
                  <span className="font-bold text-green-600">92/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Interactive trend chart would be here</p>
              <p className="text-sm text-muted-foreground">
                Showing data for last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : '1 year'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentAnalytics;