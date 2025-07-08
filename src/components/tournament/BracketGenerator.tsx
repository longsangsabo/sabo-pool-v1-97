import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BracketVisualization from './BracketVisualization';

interface BracketGeneratorProps {
  tournamentId: string;
  onBracketGenerated: () => void;
}

interface TournamentInfo {
  participant_count: number;
  bracket_exists: boolean;
  tournament_type: string;
  valid: boolean;
  reason?: string;
}

export const BracketGenerator: React.FC<BracketGeneratorProps> = ({
  tournamentId,
  onBracketGenerated
}) => {
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [seedingMethod, setSeedingMethod] = useState('elo_ranking');
  const [logs, setLogs] = useState<string[]>([]);
  const [showBracket, setShowBracket] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    checkBracketGeneration();
  }, [tournamentId]);

  const checkBracketGeneration = async () => {
    try {
      setLoading(true);
      addLog('🔍 Kiểm tra thông tin giải đấu...');
      
      const { data, error } = await supabase.rpc('can_generate_bracket', {
        p_tournament_id: tournamentId
      });

      if (error) throw error;

      setTournamentInfo(data as unknown as TournamentInfo);
      
      if ((data as any).valid) {
        addLog(`✅ Sẵn sàng tạo bảng đấu với ${(data as any).participant_count} người chơi`);
      } else {
        addLog(`❌ Không thể tạo bảng đấu: ${(data as any).reason}`);
      }
      
      // Check if bracket already exists
      if ((data as any).bracket_exists) {
        setBracketGenerated(true);
      }
    } catch (error) {
      console.error('Error checking bracket generation:', error);
      addLog(`💥 Lỗi kiểm tra: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async () => {
    if (!tournamentInfo?.valid) return;

    setGenerating(true);
    try {
      addLog('🎯 Bắt đầu tạo bảng đấu...');
      
      const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: tournamentId,
        p_seeding_method: seedingMethod,
        p_force_regenerate: tournamentInfo.bracket_exists
      });

      if (error) throw error;

      if ((data as any).success) {
        addLog(`✅ Tạo bảng đấu thành công!`);
        addLog(`📊 ${(data as any).participant_count} người chơi, ${(data as any).matches_created} trận đấu`);
        addLog(`🏆 ${(data as any).rounds} vòng đấu, bracket size: ${(data as any).bracket_size}`);
        
        toast.success('Bảng đấu đã được tạo thành công!');
        setBracketGenerated(true);
        setShowBracket(true);
        onBracketGenerated();
      } else {
        addLog(`❌ Tạo bảng đấu thất bại: ${(data as any).error}`);
        toast.error((data as any).error);
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      addLog(`💥 Lỗi tạo bảng đấu: ${error.message}`);
      toast.error('Có lỗi xảy ra khi tạo bảng đấu');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Đang kiểm tra thông tin giải đấu...</span>
        </CardContent>
      </Card>
    );
  }

  // Show bracket visualization if requested
  if (showBracket) {
    return (
      <BracketVisualization 
        tournamentId={tournamentId}
        onClose={() => setShowBracket(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tạo Bảng Đấu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tournament Status */}
          {tournamentInfo && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Người tham gia:</span>
                <Badge variant="secondary">{tournamentInfo.participant_count}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Loại giải:</span>
                <Badge variant="outline">{tournamentInfo.tournament_type}</Badge>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {tournamentInfo && (
            <Alert variant={tournamentInfo.valid ? "default" : "destructive"}>
              {tournamentInfo.valid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {tournamentInfo.valid ? (
                  <div>
                    <p className="font-medium">Sẵn sàng tạo bảng đấu</p>
                    <p className="text-sm mt-1">
                      Giải đấu có {tournamentInfo.participant_count} người chơi, đủ điều kiện để tạo bảng đấu.
                      {tournamentInfo.bracket_exists && " (Bảng đấu hiện tại sẽ được thay thế)"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Không thể tạo bảng đấu</p>
                    <p className="text-sm mt-1">{tournamentInfo.reason}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Seeding Method Selection */}
          {tournamentInfo?.valid && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Phương thức seeding:</label>
              <Select value={seedingMethod} onValueChange={setSeedingMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elo_ranking">Theo ELO Rating (Khuyến nghị)</SelectItem>
                  <SelectItem value="registration_order">Theo thứ tự đăng ký</SelectItem>
                  <SelectItem value="random">Ngẫu nhiên</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {seedingMethod === 'elo_ranking' && "Người chơi có ELO cao sẽ được ưu tiên trong bracket"}
                {seedingMethod === 'registration_order' && "Người đăng ký sớm sẽ được ưu tiên"}
                {seedingMethod === 'random' && "Vị trí hoàn toàn ngẫu nhiên"}
              </p>
            </div>
          )}

          {/* Generation Button */}
          <div className="flex gap-2">
            <Button
              onClick={generateBracket}
              disabled={!tournamentInfo?.valid || generating}
              className="flex-1"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo bảng đấu...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {tournamentInfo?.bracket_exists ? 'Tạo lại bảng đấu' : 'Tạo bảng đấu'}
                </>
              )}
            </Button>
            
            {/* View Bracket Button */}
            {bracketGenerated && (
              <Button
                onClick={() => setShowBracket(true)}
                variant="secondary"
                disabled={loading}
              >
                <Eye className="mr-2 h-4 w-4" />
                Xem Sơ Đồ
              </Button>
            )}
            
            <Button
              onClick={checkBracketGeneration}
              variant="outline"
              disabled={loading}
            >
              🔄 Kiểm tra lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generation Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-3 rounded-lg max-h-40 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="text-foreground/80">{log}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BracketGenerator;