import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Info, Users, CheckCircle2 } from 'lucide-react';

// Available ranks
export const AVAILABLE_RANKS = [
  'K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'
] as const;

// Rank groups
export const RANK_GROUPS = {
  beginner: {
    name: 'Người mới',
    ranks: ['K', 'K+', 'I', 'I+'],
    color: 'bg-green-100 text-green-800'
  },
  intermediate: {
    name: 'Trung cấp', 
    ranks: ['H', 'H+', 'G', 'G+'],
    color: 'bg-blue-100 text-blue-800'
  },
  advanced: {
    name: 'Cao cấp',
    ranks: ['F', 'F+', 'E', 'E+'],
    color: 'bg-purple-100 text-purple-800'
  }
} as const;

// Rank descriptions
export const RANK_DESCRIPTIONS = {
  K: 'Người mới bắt đầu',
  'K+': 'Người mới có kinh nghiệm',
  I: 'Người chơi phong trào',
  'I+': 'Người chơi phong trào giỏi',
  H: 'Người chơi trung bình',
  'H+': 'Người chơi trung bình khá',
  G: 'Người chơi khá',
  'G+': 'Người chơi khá giỏi',
  F: 'Người chơi giỏi',
  'F+': 'Người chơi giỏi xuất sắc',
  E: 'Người chơi xuất sắc',
  'E+': 'Người chơi chuyên nghiệp'
} as const;

interface RankSelectorProps {
  form: UseFormReturn<any>;
}

export const RankSelector: React.FC<RankSelectorProps> = ({ form }) => {
  const { setValue, watch, formState: { errors } } = form;
  const selectedRanks = watch('eligible_ranks') || [];
  const allowAllRanks = watch('allow_all_ranks') || false;

  const handleRankToggle = (rank: string) => {
    const currentRanks = selectedRanks || [];
    const isSelected = currentRanks.includes(rank);
    
    if (isSelected) {
      setValue('eligible_ranks', currentRanks.filter((r: string) => r !== rank));
    } else {
      setValue('eligible_ranks', [...currentRanks, rank]);
    }
    
    // If manually selecting ranks, turn off "all ranks" option
    if (!isSelected) {
      setValue('allow_all_ranks', false);
    }
  };

  const handleAllRanksToggle = () => {
    const newValue = !allowAllRanks;
    setValue('allow_all_ranks', newValue);
    
    if (newValue) {
      setValue('eligible_ranks', []);
    }
  };

  const selectAllRanks = () => {
    setValue('eligible_ranks', AVAILABLE_RANKS);
    setValue('allow_all_ranks', false);
  };

  const clearAllRanks = () => {
    setValue('eligible_ranks', []);
    setValue('allow_all_ranks', false);
  };

  const getSelectedRanksDisplay = () => {
    if (allowAllRanks) return 'Tất cả hạng';
    if (!selectedRanks.length) return 'Chưa chọn hạng';
    
    // Check for continuous ranges
    const sortedRanks = [...selectedRanks].sort((a, b) => 
      AVAILABLE_RANKS.indexOf(a) - AVAILABLE_RANKS.indexOf(b)
    );
    
    return sortedRanks.join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Hạng có thể tham gia <span className="text-destructive">*</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Chọn hạng người chơi có thể đăng ký tham gia giải đấu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>

        {/* Quick Options */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_all_ranks"
              checked={allowAllRanks}
              onCheckedChange={handleAllRanksToggle}
            />
            <Label htmlFor="allow_all_ranks" className="text-sm cursor-pointer flex items-center gap-1">
              <Users className="h-3 w-3" />
              Tất cả hạng
            </Label>
          </div>
          
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllRanks}
              className="text-xs"
              disabled={allowAllRanks}
            >
              Chọn tất cả
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllRanks}
              className="text-xs"
              disabled={allowAllRanks}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>

        {/* Rank Groups */}
        {!allowAllRanks && (
          <div className="space-y-4">
            {Object.entries(RANK_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge className={group.color}>{group.name}</Badge>
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {group.ranks.map((rank) => (
                    <TooltipProvider key={rank}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`rank-${rank}`}
                              checked={selectedRanks.includes(rank)}
                              onCheckedChange={() => handleRankToggle(rank)}
                            />
                            <Label 
                              htmlFor={`rank-${rank}`} 
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              <Badge variant="outline" className="text-xs">
                                {rank}
                              </Badge>
                              {selectedRanks.includes(rank) && (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              )}
                            </Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{RANK_DESCRIPTIONS[rank as keyof typeof RANK_DESCRIPTIONS]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Hạng được chọn:</span>
            <span className={`${(!selectedRanks.length && !allowAllRanks) ? 'text-destructive' : 'text-foreground'}`}>
              {getSelectedRanksDisplay()}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {errors.eligible_ranks && (
          <p className="text-sm text-destructive">{String(errors.eligible_ranks.message)}</p>
        )}
      </div>
    </div>
  );
};