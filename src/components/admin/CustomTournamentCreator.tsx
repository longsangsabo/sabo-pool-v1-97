import React, { useState } from 'react';
import { Trophy, Settings, Users, DollarSign, Calendar, MapPin, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RankDistribution {
  rank: string;
  percentage: number;
  color: string;
}

const CustomTournamentCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdTournament, setCreatedTournament] = useState<any>(null);
  
  // Tournament configuration
  const [config, setConfig] = useState({
    name: `Custom Test Tournament ${Date.now()}`,
    description: 'Tournament test tùy chỉnh với các thông số có thể điều chỉnh',
    participantCount: 16,
    tournamentType: 'single_elimination',
    entryFee: 0,
    prizePool: 1000000,
    venue: 'Sabo Pool Arena - Test Venue',
    venueAddress: 'Sabo Pool Arena, Test Location',
    rules: 'Race to 5 - Standard 8-ball rules - Time limit: 30 minutes',
    daysFromNow: 7
  });

  // Rank distribution configuration
  const [rankDistribution, setRankDistribution] = useState<RankDistribution[]>([
    { rank: 'K', percentage: 20, color: 'bg-red-500' },
    { rank: 'K+', percentage: 15, color: 'bg-red-400' },
    { rank: 'I', percentage: 15, color: 'bg-orange-500' },
    { rank: 'I+', percentage: 10, color: 'bg-orange-400' },
    { rank: 'H', percentage: 10, color: 'bg-yellow-500' },
    { rank: 'H+', percentage: 10, color: 'bg-yellow-400' },
    { rank: 'G', percentage: 10, color: 'bg-green-500' },
    { rank: 'G+', percentage: 5, color: 'bg-green-400' },
    { rank: 'F', percentage: 3, color: 'bg-blue-500' },
    { rank: 'F+', percentage: 2, color: 'bg-blue-400' },
  ]);

  const participantOptions = [4, 8, 16, 32, 64];
  const tournamentTypes = [
    { value: 'single_elimination', label: 'Single Elimination' },
    { value: 'double_elimination', label: 'Double Elimination' },
    { value: 'round_robin', label: 'Round Robin' },
  ];

  const updateRankPercentage = (index: number, newPercentage: number) => {
    const newDistribution = [...rankDistribution];
    newDistribution[index].percentage = newPercentage;
    
    // Auto-adjust other percentages to maintain 100%
    const total = newDistribution.reduce((sum, rank, i) => i === index ? sum : sum + rank.percentage, 0);
    const remaining = 100 - newPercentage;
    
    if (total > 0) {
      newDistribution.forEach((rank, i) => {
        if (i !== index) {
          rank.percentage = Math.round((rank.percentage / total) * remaining);
        }
      });
    }
    
    setRankDistribution(newDistribution);
  };

  const createCustomTournament = async () => {
    setIsCreating(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Bạn cần đăng nhập để tạo giải đấu');
      }

      // Calculate dates
      const now = new Date();
      const registrationStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
      const registrationEnd = new Date(now.getTime() + config.daysFromNow * 24 * 60 * 60 * 1000);
      const startDate = new Date(registrationEnd.getTime() + 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      // Create tournament
      const tournamentData = {
        name: config.name,
        description: config.description,
        tournament_type: config.tournamentType,
        max_participants: config.participantCount,
        current_participants: 0,
        entry_fee: config.entryFee,
        prize_pool: config.prizePool,
        registration_start: registrationStart.toISOString(),
        registration_end: registrationEnd.toISOString(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_name: config.venue,
        venue_address: config.venueAddress,
        status: 'upcoming',
        management_status: 'draft',
        created_by: user.id,
        rules: config.rules,
        metadata: {
          custom_config: config,
          rank_distribution: rankDistribution,
          is_test_tournament: true
        } as any
      };

      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert(tournamentData)
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      setCreatedTournament(tournament);
      toast.success(`Đã tạo giải đấu custom: ${tournament.name}`);

    } catch (error) {
      console.error('Error creating custom tournament:', error);
      toast.error(`Lỗi tạo giải đấu: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const totalPercentage = rankDistribution.reduce((sum, rank) => sum + rank.percentage, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tạo Giải Đấu Test Tùy Chỉnh
          </CardTitle>
          <CardDescription>
            Tùy chỉnh các thông số giải đấu bao gồm số người, rank distribution, giải thưởng và thời gian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên giải đấu</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="participants">Số người tham gia</Label>
              <Select 
                value={config.participantCount.toString()} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, participantCount: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {participantOptions.map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} người
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại giải đấu</Label>
              <Select 
                value={config.tournamentType} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, tournamentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tournamentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="days">Bắt đầu sau (ngày)</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="30"
                value={config.daysFromNow}
                onChange={(e) => setConfig(prev => ({ ...prev, daysFromNow: parseInt(e.target.value) || 7 }))}
              />
            </div>
          </div>

          {/* Prize Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-fee" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Lệ phí đăng ký (VNĐ)
              </Label>
              <Input
                id="entry-fee"
                type="number"
                min="0"
                value={config.entryFee}
                onChange={(e) => setConfig(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prize-pool" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tổng giải thưởng (VNĐ)
              </Label>
              <Input
                id="prize-pool"
                type="number"
                min="0"
                value={config.prizePool}
                onChange={(e) => setConfig(prev => ({ ...prev, prizePool: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Venue Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Tên địa điểm
              </Label>
              <Input
                id="venue"
                value={config.venue}
                onChange={(e) => setConfig(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venue-address">Địa chỉ</Label>
              <Input
                id="venue-address"
                value={config.venueAddress}
                onChange={(e) => setConfig(prev => ({ ...prev, venueAddress: e.target.value }))}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả giải đấu</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Luật chơi</Label>
            <Textarea
              id="rules"
              value={config.rules}
              onChange={(e) => setConfig(prev => ({ ...prev, rules: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rank Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Phân Bố Rank Người Chơi Test
            <Badge variant={totalPercentage === 100 ? "default" : "destructive"}>
              {totalPercentage}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Tùy chỉnh tỷ lệ phần trăm của từng rank trong số {config.participantCount} người chơi test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {rankDistribution.map((rank, index) => (
              <div key={rank.rank} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${rank.color}`}></div>
                    Rank {rank.rank}
                  </Label>
                  <span className="text-sm font-medium">{rank.percentage}%</span>
                </div>
                <Slider
                  value={[rank.percentage]}
                  onValueChange={(value) => updateRankPercentage(index, value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  ~{Math.round((rank.percentage / 100) * config.participantCount)} người
                </div>
              </div>
            ))}
          </div>

          {totalPercentage !== 100 && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ Tổng phần trăm phải bằng 100%. Hiện tại: {totalPercentage}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={createCustomTournament}
            disabled={isCreating || totalPercentage !== 100}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo giải đấu custom...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Tạo Giải Đấu Test ({config.participantCount} người)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Success Display */}
      {createdTournament && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="h-5 w-5" />
              Giải đấu đã được tạo thành công!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Tên:</strong> {createdTournament.name}</div>
              <div><strong>ID:</strong> {createdTournament.id}</div>
              <div><strong>Loại:</strong> {createdTournament.tournament_type}</div>
              <div><strong>Số người:</strong> {createdTournament.max_participants}</div>
              <div><strong>Giải thưởng:</strong> {createdTournament.prize_pool?.toLocaleString()} VNĐ</div>
              <div><strong>Trạng thái:</strong> {createdTournament.status}</div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
              💡 <strong>Tip:</strong> Giờ bạn có thể sử dụng Tournament Testing Tools để thêm {config.participantCount} demo users với rank distribution tùy chỉnh vào giải đấu này.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomTournamentCreator;