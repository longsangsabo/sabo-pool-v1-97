import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Target, TrendingDown, Clock, Zap } from 'lucide-react';
import { useEnhancedChallenges } from '@/hooks/useEnhancedChallenges';

export function DailyChallengeTracker() {
  const { 
    dailyStats, 
    isLoadingStats, 
    canCreateChallenge, 
    getRemainingChallenges 
  } = useEnhancedChallenges();

  if (isLoadingStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressValue = dailyStats ? (dailyStats.count / 2) * 100 : 0;
  const remaining = getRemainingChallenges();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Thách đấu hôm nay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">
              {dailyStats?.count || 0}/2
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Status */}
        <div className="space-y-2">
          {dailyStats?.limitReached ? (
            <Alert className="border-orange-200 bg-orange-50">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-1">
                  <p className="font-medium">Đã đạt giới hạn hàng ngày</p>
                  <p className="text-xs">
                    Các thách đấu tiếp theo chỉ nhận 30% điểm SPA
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>Còn {remaining} thách đấu</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>100% điểm</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Thách đấu reset vào 00:00 hàng ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3 w-3" />
            <span>Quá 2 thách đấu/ngày: giảm 70% điểm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}