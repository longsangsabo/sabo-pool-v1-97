import React from 'react';
import { TournamentProvider, useTournament } from '@/contexts/TournamentContext';
import { TournamentRewardsTable } from '@/components/tournament/TournamentRewardsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TournamentTier, GameFormat } from '@/types/tournament-enums';
import { RewardsService } from '@/services/RewardsService';
import { Users, DollarSign, Trophy, Calendar } from 'lucide-react';

// Example Form Component
const TournamentForm: React.FC = () => {
  const { tournament, updateTournament, saveDraft, createTournament } = useTournament();

  const handleBasicInfoChange = (field: string, value: any) => {
    updateTournament({ [field]: value });
  };

  const handleAutoFillFromClub = () => {
    // Auto-fill example from club profile
    updateTournament({
      venue_address: "CLB Billiards Saigon, 123 Nguyễn Huệ, Q1, TP.HCM",
      contact_info: "0901234567 - manager@saigonbilliards.com"
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên giải đấu</Label>
            <Input
              id="name"
              value={tournament?.name || ''}
              onChange={(e) => handleBasicInfoChange('name', e.target.value)}
              placeholder="Nhập tên giải đấu..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tier_level">Hạng thi đấu</Label>
            <Select 
              value={tournament?.tier_level?.toString()} 
              onValueChange={(value) => handleBasicInfoChange('tier_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="K">Hạng K</SelectItem>
                <SelectItem value="I">Hạng I</SelectItem>
                <SelectItem value="H">Hạng H</SelectItem>
                <SelectItem value="G">Hạng G</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_participants">Số người tham gia</Label>
            <Select 
              value={tournament?.max_participants?.toString()} 
              onValueChange={(value) => handleBasicInfoChange('max_participants', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn số người" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 người</SelectItem>
                <SelectItem value="16">16 người</SelectItem>
                <SelectItem value="32">32 người</SelectItem>
                <SelectItem value="64">64 người</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry_fee">Phí tham gia (VNĐ)</Label>
            <Input
              id="entry_fee"
              type="number"
              value={tournament?.entry_fee || 0}
              onChange={(e) => handleBasicInfoChange('entry_fee', parseInt(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="col-span-full">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAutoFillFromClub}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Tự động điền từ thông tin CLB
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-calculated Rewards Preview */}
      {tournament?.tier_level && tournament?.max_participants && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Phần thưởng (Tự động tính toán)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentRewardsTable
              rewards={tournament.rewards}
              rank={tournament.tier_level as any}
              entryFee={tournament.entry_fee}
              maxParticipants={tournament.max_participants}
              isEditable={true}
              onEdit={() => console.log('Edit rewards')}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={saveDraft}>
          Lưu nháp
        </Button>
        <Button onClick={createTournament}>
          Tạo giải đấu
        </Button>
      </div>
    </div>
  );
};

// Live Preview Component
const TournamentPreview: React.FC = () => {
  const { tournament } = useTournament();

  if (!tournament) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Điền thông tin để xem preview
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview giải đấu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{tournament.name || 'Tên giải đấu'}</h3>
          <p className="text-muted-foreground">Hạng {tournament.tier_level} • {tournament.max_participants} người</p>
        </div>

        {tournament.entry_fee > 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <DollarSign className="w-4 h-4" />
            <span>Phí tham gia: {tournament.entry_fee.toLocaleString('vi-VN')}₫</span>
          </div>
        )}

        {tournament.rewards && (
          <div>
            <h4 className="font-medium mb-2">Tổng giải thưởng</h4>
            <p className="text-2xl font-bold text-primary">
              {tournament.rewards.totalPrize.toLocaleString('vi-VN')}₫
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>• Tự động tính toán dựa trên hạng và số người tham gia</p>
          <p>• Đồng bộ thời gian thực với form</p>
          <p>• Lưu nháp tự động</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Page Component
const CreateTournamentExample: React.FC = () => {
  return (
    <TournamentProvider>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tạo giải đấu mới</h1>
          <p className="text-muted-foreground">
            Sử dụng kiến trúc mới với auto-calculation và real-time sync
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <TournamentForm />
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <TournamentPreview />
            </div>
          </div>
        </div>
      </div>
    </TournamentProvider>
  );
};

export default CreateTournamentExample;