import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Calculator, Trophy, Target, Zap, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SPACalculation {
  basePoints: number;
  winBonus: number;
  streakBonus: number;
  difficultyBonus: number;
  timeBonus: number;
  tournamentBonus: number;
  totalPoints: number;
}

interface PlayerStats {
  currentStreak: number;
  totalWins: number;
  averageOpponentElo: number;
  recentPerformance: number;
}

const SPAPointsCalculator = () => {
  const { user } = useAuth();
  const [calculation, setCalculation] = useState<SPACalculation | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulatedMatch, setSimulatedMatch] = useState({
    opponentElo: 1200,
    isWin: true,
    matchDuration: 30,
    isTournament: false,
    streakContinues: true
  });

  useEffect(() => {
    if (user) {
      fetchPlayerStats();
    }
  }, [user]);

  const fetchPlayerStats = async () => {
    if (!user) return;

    try {
      const { data: rankings } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('player_id', user.id)
        .single();

      const { data: recentMatches } = await supabase
        .from('match_results')
        .select('*')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (rankings && recentMatches) {
        const wins = recentMatches.filter(match => match.winner_id === user.id).length;
        const avgOpponentElo = recentMatches.reduce((sum, match) => {
          const opponentElo = match.player1_id === user.id ? 
            match.player2_elo_before : match.player1_elo_before;
          return sum + opponentElo;
        }, 0) / recentMatches.length;

        setPlayerStats({
          currentStreak: rankings.win_streak || 0,
          totalWins: rankings.wins || 0,
          averageOpponentElo: Math.round(avgOpponentElo) || 1000,
          recentPerformance: Math.round((wins / recentMatches.length) * 100)
        });
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const calculateSPAPoints = () => {
    if (!playerStats) return;

    setLoading(true);
    
    // Base points calculation
    const basePoints = simulatedMatch.isWin ? 100 : 25;
    
    // Win bonus (extra points for victory)
    const winBonus = simulatedMatch.isWin ? 50 : 0;
    
    // Streak bonus (5 points per streak level)
    const currentStreak = simulatedMatch.streakContinues ? playerStats.currentStreak + 1 : 0;
    const streakBonus = Math.min(currentStreak * 5, 100); // Max 100 bonus points
    
    // Difficulty bonus (based on opponent ELO difference)
    const eloDiff = simulatedMatch.opponentElo - 1000; // Assuming user ELO is 1000
    const difficultyBonus = Math.max(0, Math.round(eloDiff * 0.1));
    
    // Time bonus (faster wins get bonus)
    const timeBonus = simulatedMatch.isWin && simulatedMatch.matchDuration < 20 ? 25 : 0;
    
    // Tournament bonus
    const tournamentBonus = simulatedMatch.isTournament ? 50 : 0;
    
    const totalPoints = basePoints + winBonus + streakBonus + difficultyBonus + timeBonus + tournamentBonus;
    
    setCalculation({
      basePoints,
      winBonus,
      streakBonus,
      difficultyBonus,
      timeBonus,
      tournamentBonus,
      totalPoints
    });
    
    setLoading(false);
  };

  const BonusCard = ({ 
    icon: Icon, 
    title, 
    points, 
    description, 
    color = "blue" 
  }: {
    icon: React.ElementType;
    title: string;
    points: number;
    description: string;
    color?: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={points > 0 ? "default" : "secondary"}>
        +{points}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            SPA Points Calculator
          </CardTitle>
          <CardDescription>
            Tính toán chi tiết điểm SPA với các bonus khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Current Stats */}
          {playerStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{playerStats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Chuỗi thắng</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{playerStats.totalWins}</p>
                <p className="text-sm text-muted-foreground">Tổng thắng</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{playerStats.averageOpponentElo}</p>
                <p className="text-sm text-muted-foreground">ELO TB đối thủ</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{playerStats.recentPerformance}%</p>
                <p className="text-sm text-muted-foreground">Form gần đây</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Match Simulation Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mô phỏng trận đấu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ELO đối thủ</label>
                <input
                  type="number"
                  value={simulatedMatch.opponentElo}
                  onChange={(e) => setSimulatedMatch(prev => ({
                    ...prev,
                    opponentElo: parseInt(e.target.value) || 1000
                  }))}
                  className="w-full p-2 border rounded-md"
                  min="800"
                  max="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thời gian trận (phút)</label>
                <input
                  type="number"
                  value={simulatedMatch.matchDuration}
                  onChange={(e) => setSimulatedMatch(prev => ({
                    ...prev,
                    matchDuration: parseInt(e.target.value) || 30
                  }))}
                  className="w-full p-2 border rounded-md"
                  min="5"
                  max="120"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulatedMatch.isWin}
                  onChange={(e) => setSimulatedMatch(prev => ({
                    ...prev,
                    isWin: e.target.checked
                  }))}
                />
                <span className="text-sm">Thắng trận</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulatedMatch.isTournament}
                  onChange={(e) => setSimulatedMatch(prev => ({
                    ...prev,
                    isTournament: e.target.checked
                  }))}
                />
                <span className="text-sm">Trận tournament</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulatedMatch.streakContinues}
                  onChange={(e) => setSimulatedMatch(prev => ({
                    ...prev,
                    streakContinues: e.target.checked
                  }))}
                />
                <span className="text-sm">Tiếp tục chuỗi thắng</span>
              </label>
            </div>

            <Button onClick={calculateSPAPoints} disabled={loading} className="w-full">
              {loading ? 'Đang tính toán...' : 'Tính điểm SPA'}
            </Button>
          </div>

          {/* Calculation Results */}
          {calculation && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">Kết quả tính điểm</h3>
              
              <div className="space-y-3">
                <BonusCard
                  icon={Target}
                  title="Điểm cơ bản"
                  points={calculation.basePoints}
                  description="Điểm cơ bản cho kết quả trận đấu"
                  color="blue"
                />
                
                <BonusCard
                  icon={Trophy}
                  title="Bonus chiến thắng"
                  points={calculation.winBonus}
                  description="Bonus thêm khi thắng trận"
                  color="green"
                />
                
                <BonusCard
                  icon={Zap}
                  title="Bonus chuỗi thắng"
                  points={calculation.streakBonus}
                  description={`Bonus cho chuỗi thắng (${playerStats?.currentStreak || 0} trận)`}
                  color="yellow"
                />
                
                <BonusCard
                  icon={Star}
                  title="Bonus độ khó"
                  points={calculation.difficultyBonus}
                  description="Bonus dựa trên ELO đối thủ"
                  color="purple"
                />
                
                <BonusCard
                  icon={TrendingUp}
                  title="Bonus thời gian"
                  points={calculation.timeBonus}
                  description="Bonus thắng nhanh (<20 phút)"
                  color="orange"
                />
                
                <BonusCard
                  icon={Trophy}
                  title="Bonus tournament"
                  points={calculation.tournamentBonus}
                  description="Bonus cho trận tournament"
                  color="red"
                />
              </div>

              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Tổng điểm SPA:</span>
                  <span className="text-2xl font-bold text-primary">+{calculation.totalPoints}</span>
                </div>
                <Progress 
                  value={(calculation.totalPoints / 500) * 100} 
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Điểm tối đa có thể đạt được: 500 SPA
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SPAPointsCalculator;