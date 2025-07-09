import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';

interface SPAPointsBreakdownProps {
  matchId?: string;
  breakdown?: {
    base_points: number;
    streak_bonus: number;
    comeback_bonus: number;
    time_multiplier: number;
    total_points: number;
  };
}

export function SPAPointsBreakdown({ matchId, breakdown }: SPAPointsBreakdownProps) {
  // Mock data for demonstration
  const mockBreakdown = {
    base_points: 150,
    streak_bonus: 25,
    comeback_bonus: 0,
    time_multiplier: 1.2,
    total_points: 210
  };

  const data = breakdown || mockBreakdown;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Chi tiết SPA Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Điểm cơ bản</span>
          </div>
          <Badge variant="secondary">
            +{data.base_points} SPA
          </Badge>
        </div>

        {/* Streak Bonus */}
        {data.streak_bonus > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Thưởng chuỗi thắng</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              +{data.streak_bonus} SPA
            </Badge>
          </div>
        )}

        {/* Comeback Bonus */}
        {data.comeback_bonus > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Thưởng trở lại</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              +{data.comeback_bonus} SPA
            </Badge>
          </div>
        )}

        {/* Time Multiplier */}
        {data.time_multiplier !== 1.0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Hệ số giờ chơi</span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              x{data.time_multiplier}
            </Badge>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between font-semibold">
          <span>Tổng cộng</span>
          <Badge className="bg-green-600 hover:bg-green-700">
            +{data.total_points} SPA
          </Badge>
        </div>

        {/* Formula Explanation */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p className="font-medium mb-1">Công thức tính:</p>
          <p>
            ({data.base_points} + {data.streak_bonus} + {data.comeback_bonus}) × {data.time_multiplier} = {data.total_points} SPA
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SPAPointsBreakdown;