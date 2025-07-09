import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Medal, 
  Gift, 
  Plus, 
  Trash2, 
  Edit2,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export interface PrizePosition {
  position: number;
  name: string;
  cashPrize: number;
  items: string[];
  isVisible: boolean;
}

export interface SpecialAward {
  id: string;
  name: string;
  cashPrize: number;
  items: string[];
  description?: string;
}

export interface PrizeStructure {
  totalPrize: number;
  positions: PrizePosition[];
  specialAwards: SpecialAward[];
  showPrizes: boolean;
}

interface PrizeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prizeStructure: PrizeStructure) => void;
  initialPrizes?: PrizeStructure;
  entryFee: number;
  maxParticipants: number;
}

const DEFAULT_POSITIONS: PrizePosition[] = [
  { position: 1, name: 'Vô địch', cashPrize: 0, items: [], isVisible: true },
  { position: 2, name: 'Á quân', cashPrize: 0, items: [], isVisible: true },
  { position: 3, name: 'Hạng 3', cashPrize: 0, items: [], isVisible: true }
];

const PRESET_ITEMS = [
  'Cúp vô địch',
  'Cúp á quân', 
  'Huy chương vàng',
  'Huy chương bạc',
  'Huy chương đồng',
  'Bằng khen',
  'Kỷ niệm chương',
  'Voucher',
  'Quà tặng đặc biệt'
];

const SPECIAL_AWARD_TYPES = [
  'Giải kỹ thuật',
  'Giải Break and Run',
  'Giải High Run',
  'Giải phong cách',
  'Giải cống hiến',
  'Giải fair play'
];

export const PrizeManagementModal: React.FC<PrizeManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPrizes,
  entryFee,
  maxParticipants
}) => {
  const [positions, setPositions] = useState<PrizePosition[]>(DEFAULT_POSITIONS);
  const [specialAwards, setSpecialAwards] = useState<SpecialAward[]>([]);
  const [showPrizes, setShowPrizes] = useState(true);
  const [newItemInput, setNewItemInput] = useState('');
  const [editingPosition, setEditingPosition] = useState<number | null>(null);

  const suggestedTotal = maxParticipants * entryFee * 0.8;

  useEffect(() => {
    if (initialPrizes) {
      setPositions(initialPrizes.positions);
      setSpecialAwards(initialPrizes.specialAwards);
      setShowPrizes(initialPrizes.showPrizes);
    } else {
      // Auto-fill with suggested amounts
      const suggestedPositions = [
        { ...DEFAULT_POSITIONS[0], cashPrize: Math.floor(suggestedTotal * 0.5) },
        { ...DEFAULT_POSITIONS[1], cashPrize: Math.floor(suggestedTotal * 0.3) },
        { ...DEFAULT_POSITIONS[2], cashPrize: Math.floor(suggestedTotal * 0.2) }
      ];
      setPositions(suggestedPositions);
    }
  }, [initialPrizes, suggestedTotal]);

  const totalCashPrizes = positions.reduce((sum, pos) => sum + pos.cashPrize, 0) +
                          specialAwards.reduce((sum, award) => sum + award.cashPrize, 0);

  const updatePosition = (position: number, field: keyof PrizePosition, value: any) => {
    setPositions(prev => prev.map(pos => 
      pos.position === position ? { ...pos, [field]: value } : pos
    ));
  };

  const addPosition = () => {
    const nextPosition = Math.max(...positions.map(p => p.position)) + 1;
    setPositions(prev => [...prev, {
      position: nextPosition,
      name: `Hạng ${nextPosition}`,
      cashPrize: 0,
      items: [],
      isVisible: true
    }]);
  };

  const removePosition = (position: number) => {
    if (positions.length <= 2) {
      toast.error('Cần có ít nhất 2 hạng giải thưởng');
      return;
    }
    setPositions(prev => prev.filter(pos => pos.position !== position));
  };

  const addItemToPosition = (position: number, item: string) => {
    if (!item.trim()) return;
    updatePosition(position, 'items', [...positions.find(p => p.position === position)?.items || [], item.trim()]);
  };

  const removeItemFromPosition = (position: number, itemIndex: number) => {
    const pos = positions.find(p => p.position === position);
    if (pos) {
      const newItems = pos.items.filter((_, index) => index !== itemIndex);
      updatePosition(position, 'items', newItems);
    }
  };

  const addSpecialAward = () => {
    const newAward: SpecialAward = {
      id: Date.now().toString(),
      name: '',
      cashPrize: 0,
      items: [],
      description: ''
    };
    setSpecialAwards(prev => [...prev, newAward]);
  };

  const updateSpecialAward = (id: string, field: keyof SpecialAward, value: any) => {
    setSpecialAwards(prev => prev.map(award => 
      award.id === id ? { ...award, [field]: value } : award
    ));
  };

  const removeSpecialAward = (id: string) => {
    setSpecialAwards(prev => prev.filter(award => award.id !== id));
  };

  const autoDistributePrizes = () => {
    const updatedPositions = positions.map(pos => {
      let percentage = 0;
      switch (pos.position) {
        case 1: percentage = 0.5; break;
        case 2: percentage = 0.3; break; 
        case 3: percentage = 0.2; break;
        default: percentage = 0.1 / (positions.length - 3); break;
      }
      return { ...pos, cashPrize: Math.floor(suggestedTotal * percentage) };
    });
    setPositions(updatedPositions);
  };

  const handleSave = () => {
    const prizeStructure: PrizeStructure = {
      totalPrize: totalCashPrizes,
      positions,
      specialAwards,
      showPrizes
    };
    onSave(prizeStructure);
    onClose();
    toast.success('Cấu hình giải thưởng đã được lưu');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quản lý giải thưởng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showPrizes"
                  checked={showPrizes}
                  onCheckedChange={(checked) => setShowPrizes(checked === true)}
                />
                <Label htmlFor="showPrizes" className="flex items-center gap-2">
                  {showPrizes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Công khai giải thưởng
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={autoDistributePrizes}
                className="text-xs"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Phân chia tự động
              </Button>
            </div>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tóm tắt tài chính</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tổng thu từ phí tham gia:</span>
                <span className="font-medium">{(maxParticipants * entryFee).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng giải thưởng:</span>
                <span className="font-medium">{totalCashPrizes.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Lợi nhuận:</span>
                <span className={totalCashPrizes <= maxParticipants * entryFee ? 'text-green-600' : 'text-red-600'}>
                  {(maxParticipants * entryFee - totalCashPrizes).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Position Prizes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Giải thưởng theo hạng</CardTitle>
              <Button variant="outline" size="sm" onClick={addPosition}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm hạng
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {positions.map((position) => (
                <div key={position.position} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={position.position <= 3 ? 'default' : 'outline'}>
                        {position.position === 1 && '🥇'}
                        {position.position === 2 && '🥈'} 
                        {position.position === 3 && '🥉'}
                        {position.position > 3 && `#${position.position}`}
                      </Badge>
                      <Input
                        value={position.name}
                        onChange={(e) => updatePosition(position.position, 'name', e.target.value)}
                        className="w-32"
                        placeholder="Tên hạng"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={position.isVisible}
                        onCheckedChange={(checked) => updatePosition(position.position, 'isVisible', checked)}
                      />
                      <Label className="text-xs">Hiển thị</Label>
                      {positions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.position)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tiền thưởng (VNĐ)</Label>
                      <Input
                        type="number"
                        value={position.cashPrize}
                        onChange={(e) => updatePosition(position.position, 'cashPrize', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phần thưởng hiện vật</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => addItemToPosition(position.position, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phần thưởng" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRESET_ITEMS.map(item => (
                              <SelectItem key={item} value={item}>{item}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Hoặc nhập tùy chỉnh"
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addItemToPosition(position.position, newItemInput);
                              setNewItemInput('');
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {position.items.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeItemFromPosition(position.position, index)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Special Awards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Giải thưởng đặc biệt</CardTitle>
              <Button variant="outline" size="sm" onClick={addSpecialAward}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm giải đặc biệt
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {specialAwards.map((award) => (
                <div key={award.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Select
                      value={award.name}
                      onValueChange={(value) => updateSpecialAward(award.id, 'name', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Chọn loại giải" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIAL_AWARD_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecialAward(award.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tiền thưởng (VNĐ)</Label>
                      <Input
                        type="number"
                        value={award.cashPrize}
                        onChange={(e) => updateSpecialAward(award.id, 'cashPrize', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Mô tả</Label>
                      <Input
                        value={award.description || ''}
                        onChange={(e) => updateSpecialAward(award.id, 'description', e.target.value)}
                        placeholder="Mô tả giải thưởng"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {specialAwards.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Chưa có giải thưởng đặc biệt nào
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};