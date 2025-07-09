import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Calculator, Award, Users, CheckCircle } from 'lucide-react';
import { useTournamentSPAManager } from '@/hooks/useTournamentSPAManager';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  rank: string;
  position?: string;
}

interface TournamentSPAManagerProps {
  tournamentId: string;
  players: Player[];
  tournamentType?: 'normal' | 'season' | 'open';
  onComplete?: () => void;
}

const POSITIONS = [
  { value: 'champion', label: 'Vô địch', icon: '🥇' },
  { value: 'runner_up', label: 'Á quân', icon: '🥈' },
  { value: 'top_3', label: 'Top 3', icon: '🥉' },
  { value: 'top_4', label: 'Top 4', icon: '4️⃣' },
  { value: 'top_8', label: 'Top 8', icon: '8️⃣' },
  { value: 'participation', label: 'Tham gia', icon: '🎮' }
];

const RANK_OPTIONS = ['E', 'F', 'G', 'H', 'I', 'K'];

export function TournamentSPAManager({ 
  tournamentId, 
  players, 
  tournamentType = 'normal',
  onComplete 
}: TournamentSPAManagerProps) {
  const [playerResults, setPlayerResults] = useState<Map<string, { position: string; rank: string }>>(new Map());
  const [calculations, setCalculations] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    awardBulkSPA, 
    calculateBulkSPA, 
    isProcessing, 
    isAwarding 
  } = useTournamentSPAManager();

  const handlePlayerUpdate = (playerId: string, field: 'position' | 'rank', value: string) => {
    setPlayerResults(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(playerId) || { position: '', rank: '' };
      newMap.set(playerId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const calculatePreview = async () => {
    const results = Array.from(playerResults.entries())
      .filter(([_, data]) => data.position && data.rank)
      .map(([playerId, data]) => ({
        tournamentId,
        playerId,
        position: data.position as any,
        playerRank: data.rank,
        tournamentType
      }));

    if (results.length === 0) {
      toast.error('Vui lòng thiết lập kết quả cho ít nhất 1 người chơi');
      return;
    }

    try {
      const calculations = await calculateBulkSPA(results);
      setCalculations(calculations);
      setShowPreview(true);
    } catch (error) {
      toast.error('Lỗi khi tính toán điểm SPA');
    }
  };

  const awardSPA = async () => {
    const results = Array.from(playerResults.entries())
      .filter(([_, data]) => data.position && data.rank)
      .map(([playerId, data]) => ({
        tournamentId,
        playerId,
        position: data.position as any,
        playerRank: data.rank,
        tournamentType
      }));

    try {
      await awardBulkSPA(results);
      toast.success('Đã trao điểm SPA thành công!');
      onComplete?.();
    } catch (error) {
      toast.error('Lỗi khi trao điểm SPA');
    }
  };

  const getMultiplierText = () => {
    switch (tournamentType) {
      case 'season': return 'x1.5 (Season)';
      case 'open': return 'x2.0 (Open)';
      default: return 'x1.0 (Normal)';
    }
  };

  const getTotalSPA = () => {
    return calculations.reduce((sum, calc) => sum + calc.spaPoints, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quản lý SPA Points Giải đấu
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Loại giải: {getMultiplierText()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{players.length} người chơi</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {players.map((player) => {
              const result = playerResults.get(player.id);
              return (
                <div key={player.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{player.name}</Label>
                    <p className="text-xs text-muted-foreground">Hạng hiện tại: {player.rank}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`position-${player.id}`}>Thứ hạng</Label>
                    <Select
                      value={result?.position || ''}
                      onValueChange={(value) => handlePlayerUpdate(player.id, 'position', value)}
                    >
                      <SelectTrigger id={`position-${player.id}`}>
                        <SelectValue placeholder="Chọn thứ hạng" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos.value} value={pos.value}>
                            <div className="flex items-center gap-2">
                              <span>{pos.icon}</span>
                              <span>{pos.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`rank-${player.id}`}>Hạng tính SPA</Label>
                    <Select
                      value={result?.rank || player.rank}
                      onValueChange={(value) => handlePlayerUpdate(player.id, 'rank', value)}
                    >
                      <SelectTrigger id={`rank-${player.id}`}>
                        <SelectValue placeholder="Chọn hạng" />
                      </SelectTrigger>
                      <SelectContent>
                        {RANK_OPTIONS.map((rank) => (
                          <SelectItem key={rank} value={rank}>
                            Hạng {rank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    {result?.position && result?.rank ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Đã thiết lập
                      </Badge>
                    ) : (
                      <Badge variant="outline">Chưa thiết lập</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button
              onClick={calculatePreview}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Tính toán trước
            </Button>
            
            {showPreview && (
              <Button
                onClick={awardSPA}
                disabled={isAwarding}
                className="flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                {isAwarding ? 'Đang trao điểm...' : 'Trao điểm SPA'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPreview && calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Xem trước điểm SPA
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Tổng cộng: <strong>{getTotalSPA().toLocaleString()} SPA điểm</strong>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người chơi</TableHead>
                  <TableHead>Thứ hạng</TableHead>
                  <TableHead>Hạng</TableHead>
                  <TableHead>Điểm cơ bản</TableHead>
                  <TableHead>Hệ số</TableHead>
                  <TableHead className="text-right">SPA điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => {
                  const player = players.find(p => p.id === calc.playerId);
                  const position = POSITIONS.find(p => p.value === calc.position);
                  
                  return (
                    <TableRow key={calc.playerId}>
                      <TableCell className="font-medium">{player?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{position?.icon}</span>
                          <span>{position?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>Hạng {calc.playerRank}</TableCell>
                      <TableCell>{calc.breakdown.basePoints.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={calc.breakdown.multiplier > 1 ? 'default' : 'secondary'}>
                          x{calc.breakdown.multiplier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        +{calc.spaPoints.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}