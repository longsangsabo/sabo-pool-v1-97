import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, StarIcon, GiftIcon } from 'lucide-react';

interface SPAMilestone {
  points: number;
  title: string;
  reward: string;
  completed: boolean;
}

interface SPAPointsCardProps {
  points: number;
  milestones?: SPAMilestone[];
  weeklyRank?: number;
  monthlyRank?: number;
}

export const SPAPointsCard: React.FC<SPAPointsCardProps> = ({
  points,
  milestones = [],
  weeklyRank,
  monthlyRank
}) => {
  // Tìm milestone tiếp theo
  const nextMilestone = milestones.find(m => !m.completed && m.points > points);
  const progressToNext = nextMilestone 
    ? Math.min(100, (points / nextMilestone.points) * 100)
    : 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-yellow-500" />
            <span>SPA Points</span>
            <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-yellow-200">
              {points.toLocaleString('vi-VN')}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p><strong>SPA Points là hệ thống "Ranking vui" và đổi thưởng.</strong></p>
                <p>Kiếm điểm từ thách đấu, giải đấu và hoàn thành milestone.</p>
                <p>Dùng để xếp hạng tuần/tháng và đổi phần thưởng hấp dẫn.</p>
                <p>Khác với ELO - SPA Points không ảnh hưởng đến hạng chính thức.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Ranking Info */}
        <div className="grid grid-cols-2 gap-4">
          {weeklyRank && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">#{weeklyRank}</div>
              <div className="text-xs text-blue-600">Xếp hạng tuần</div>
            </div>
          )}
          {monthlyRank && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">#{monthlyRank}</div>
              <div className="text-xs text-green-600">Xếp hạng tháng</div>
            </div>
          )}
        </div>

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Milestone tiếp theo:</span>
              <span className="font-medium">{nextMilestone.title}</span>
            </div>
            
            <Progress value={progressToNext} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{points.toLocaleString('vi-VN')} / {nextMilestone.points.toLocaleString('vi-VN')}</span>
              <span>{(nextMilestone.points - points).toLocaleString('vi-VN')} điểm nữa</span>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <GiftIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  <strong>Phần thưởng:</strong> {nextMilestone.reward}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Milestone gần đây</h4>
            <div className="space-y-1">
              {milestones.slice(-3).map((milestone, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    milestone.completed 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <span>{milestone.title}</span>
                  <div className="flex items-center gap-1">
                    <span>{milestone.points.toLocaleString('vi-VN')}</span>
                    {milestone.completed && <span>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SPA Earning Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Mẹo kiếm SPA:</strong> Thách đấu hàng ngày (+50), chuỗi thắng (+25/trận), 
            comeback (+100), tham gia giải đấu (tùy hạng)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};