import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Trophy, Gift, DollarSign, Star, AlertTriangle } from 'lucide-react';
import { TournamentRewards, RewardPosition, SpecialAward } from '@/types/tournament-extended';
import { TournamentTier, GameFormat } from '@/types/tournament-enums';
import { RewardsService } from '@/services/RewardsService';
import { toast } from 'sonner';

interface RewardsEditModalProps {
  rewards: TournamentRewards;
  tournamentData: {
    tier_level: TournamentTier;
    entry_fee: number;
    max_participants: number;
    game_format: GameFormat;
  };
  onSave: (rewards: TournamentRewards) => void;
  onCancel: () => void;
}

export const RewardsEditModal: React.FC<RewardsEditModalProps> = ({
  rewards: initialRewards,
  tournamentData,
  onSave,
  onCancel,
}) => {
  const [rewards, setRewards] = useState<TournamentRewards>(initialRewards);
  const [activeTab, setActiveTab] = useState('positions');
  const [validation, setValidation] = useState<ReturnType<typeof RewardsService.validateRewards> | null>(null);

  // Update validation when rewards change
  useEffect(() => {
    const newValidation = RewardsService.validateRewards(rewards, tournamentData.max_participants);
    setValidation(newValidation);
  }, [rewards, tournamentData.max_participants]);

  // Update position data
  const updatePosition = (index: number, field: keyof RewardPosition, value: any) => {
    const newPositions = [...rewards.positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    
    setRewards(prev => ({
      ...prev,
      positions: newPositions,
    }));
  };

  // Add special award
  const addSpecialAward = () => {
    const newAward: SpecialAward = {
      id: `award-${Date.now()}`,
      name: '',
      description: '',
      cashPrize: 0,
    };
    
    setRewards(prev => ({
      ...prev,
      specialAwards: [...prev.specialAwards, newAward],
    }));
  };

  // Update special award
  const updateSpecialAward = (index: number, field: keyof SpecialAward, value: any) => {
    const newAwards = [...rewards.specialAwards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    
    setRewards(prev => ({
      ...prev,
      specialAwards: newAwards,
    }));
  };

  // Remove special award
  const removeSpecialAward = (index: number) => {
    setRewards(prev => ({
      ...prev,
      specialAwards: prev.specialAwards.filter((_, i) => i !== index),
    }));
  };

  // Reset to auto-calculated values
  const resetToAutoCalculated = () => {
    const autoRewards = RewardsService.calculateRewards(
      tournamentData.tier_level,
      tournamentData.entry_fee,
      tournamentData.max_participants,
      tournamentData.game_format
    );
    
    setRewards(autoRewards);
    toast.success('Đã khôi phục về giá trị tự động tính');
  };

  // Apply template
  const applyTemplate = (templateType: 'basic' | 'premium' | 'championship') => {
    const template = RewardsService.generateTemplateRewards(templateType);
    
    setRewards(prev => ({
      ...prev,
      positions: prev.positions.map(pos => {
        const templatePos = template.positions?.find(tp => tp.position === pos.position);
        return templatePos ? { ...pos, items: templatePos.items } : pos;
      }),
      specialAwards: template.specialAwards || [],
    }));
    
    toast.success(`Đã áp dụng mẫu ${templateType}`);
  };

  // Handle save
  const handleSave = () => {
    if (!validation?.isValid) {
      toast.error('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }

    // Recalculate total prize
    const totalCashDistributed = rewards.positions.reduce((sum, pos) => sum + pos.cashPrize, 0);
    const specialAwardTotal = rewards.specialAwards.reduce((sum, award) => sum + award.cashPrize, 0);
    
    const updatedRewards = {
      ...rewards,
      totalPrize: totalCashDistributed + specialAwardTotal,
    };

    onSave(updatedRewards);
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Chỉnh sửa phần thưởng
          </DialogTitle>
        </DialogHeader>

        {/* Validation Messages */}
        {validation && !validation.isValid && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Có lỗi cần sửa
            </div>
            {validation.errors.map((error, index) => (
              <div key={index} className="text-sm text-destructive">• {error}</div>
            ))}
          </div>
        )}

        {validation && validation.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-800 text-sm">
              {validation.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="positions">Vị trí thưởng</TabsTrigger>
            <TabsTrigger value="special">Giải đặc biệt</TabsTrigger>
            <TabsTrigger value="templates">Mẫu có sẵn</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <div className="space-y-4">
              {rewards.positions.map((position, index) => (
                <Card key={position.position}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {position.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={position.isVisible}
                          onCheckedChange={(checked) => updatePosition(index, 'isVisible', checked)}
                        />
                        <Label className="text-xs">Hiển thị</Label>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">ELO Points</Label>
                        <Input
                          type="number"
                          value={position.eloPoints}
                          onChange={(e) => updatePosition(index, 'eloPoints', parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SPA Points</Label>
                        <Input
                          type="number"
                          value={position.spaPoints}
                          onChange={(e) => updatePosition(index, 'spaPoints', parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tiền thưởng (VNĐ)</Label>
                        <Input
                          type="number"
                          value={position.cashPrize}
                          onChange={(e) => updatePosition(index, 'cashPrize', parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">% Tổng giải</Label>
                        <Input
                          value={rewards.totalPrize > 0 ? ((position.cashPrize / rewards.totalPrize) * 100).toFixed(1) + '%' : '0%'}
                          readOnly
                          className="h-8 bg-muted"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Hiện vật</Label>
                      <Textarea
                        value={position.items.join(', ')}
                        onChange={(e) => updatePosition(index, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="Cúp vàng, Bằng khen, Áo phông..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Tổng tiền thưởng: {rewards.positions.reduce((sum, pos) => sum + pos.cashPrize, 0).toLocaleString()}₫
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={resetToAutoCalculated}
                size="sm"
              >
                Khôi phục tự động
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Giải thưởng đặc biệt</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecialAward}
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm giải
              </Button>
            </div>

            {rewards.specialAwards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chưa có giải thưởng đặc biệt</p>
                <p className="text-sm">Thêm giải Break đẹp nhất, Fair-play, v.v.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.specialAwards.map((award, index) => (
                  <Card key={award.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Tên giải</Label>
                              <Input
                                value={award.name}
                                onChange={(e) => updateSpecialAward(index, 'name', e.target.value)}
                                placeholder="VD: Break xuất sắc nhất"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Tiền thưởng (VNĐ)</Label>
                              <Input
                                type="number"
                                value={award.cashPrize}
                                onChange={(e) => updateSpecialAward(index, 'cashPrize', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Mô tả</Label>
                            <Textarea
                              value={award.description || ''}
                              onChange={(e) => updateSpecialAward(index, 'description', e.target.value)}
                              placeholder="Mô tả tiêu chí giải thưởng..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecialAward(index)}
                          className="ml-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {rewards.specialAwards.length > 0 && (
              <div className="text-sm text-muted-foreground pt-4 border-t">
                Tổng giải đặc biệt: {rewards.specialAwards.reduce((sum, award) => sum + award.cashPrize, 0).toLocaleString()}₫
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate('basic')}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Chỉ có cúp và giấy khen cho các vị trí chính
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Cúp + Giấy khen (1st)</div>
                    <div>• Huy chương bạc (2nd)</div>
                    <div>• Huy chương đồng (3rd)</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate('premium')}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Cao cấp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Thêm áo phông và giải đặc biệt
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Cúp vàng + Áo phông (1st)</div>
                    <div>• Cúp bạc + Giấy khen (2nd)</div>
                    <div>• Giải Break đẹp nhất</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate('championship')}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Vô địch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Đầy đủ giải thưởng cho giải đấu lớn
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Cúp vô địch + Que tặng</div>
                    <div>• Nhiều giải đặc biệt</div>
                    <div>• Áo phông cho top 3</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">Lưu ý về mẫu</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Các mẫu chỉ thay đổi hiện vật và giải đặc biệt. Tiền thưởng và điểm số vẫn được tính tự động dựa trên cài đặt giải đấu.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSave}
            disabled={validation && !validation.isValid}
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};