import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calculator, Star, Info } from 'lucide-react';
import { RANK_ELO, TOURNAMENT_ELO_REWARDS, FIXED_K_FACTOR } from '@/utils/eloConstants';
import { formatRankDisplay, getRankColor } from '@/utils/rankUtils';
import { ELORulesModal } from './ELORulesModal';

export const ELOSystemInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hệ thống ELO</h2>
          <p className="text-muted-foreground">Quản lý và thông tin về hệ thống xếp hạng ELO</p>
        </div>
        <ELORulesModal />
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5" />
              Tính toán ELO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">K-Factor:</span>
                <Badge variant="secondary">{FIXED_K_FACTOR}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Cố định cho tất cả người chơi, đơn giản và công bằng
              </div>
              <div className="bg-muted rounded p-2 text-xs">
                ELO mới = ELO cũ + 32 × (Kết quả - Dự đoán)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5" />
              Thăng hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Điều kiện:</span>
                <Badge variant="outline">Chỉ cần ELO</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Tự động thăng hạng khi đạt đủ điểm ELO yêu cầu
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Star className="w-3 h-3" />
                Không giới hạn thời gian chờ
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5" />
              Cải tiến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Đơn giản hóa</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Minh bạch</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Tự động hóa</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Công bằng</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rank Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Yêu cầu điểm ELO cho từng hạng
          </CardTitle>
          <CardDescription>
            Hệ thống hạng từ K đến E+ với điểm ELO tương ứng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(RANK_ELO).map(([rankCode, eloPoints]) => (
              <div
                key={rankCode}
                className="bg-background border rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className={`font-bold text-xl mb-1 ${getRankColor(rankCode as any)}`}>
                  {rankCode}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {formatRankDisplay(rankCode as any)}
                </div>
                <div className="text-lg font-semibold">
                  {eloPoints}+
                </div>
                <div className="text-xs text-muted-foreground">
                  điểm ELO
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Phần thưởng ELO giải đấu
          </CardTitle>
          <CardDescription>
            Điểm ELO thưởng dựa trên thứ hạng trong giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(TOURNAMENT_ELO_REWARDS).map(([position, reward]) => {
              const positionNames: Record<string, string> = {
                CHAMPION: 'Vô địch',
                RUNNER_UP: 'Á quân',
                THIRD_PLACE: 'Hạng 3',
                FOURTH_PLACE: 'Hạng 4',
                TOP_8: 'Top 8',
                TOP_16: 'Top 16',
                PARTICIPATION: 'Tham gia'
              };

              const getPositionColor = (pos: string) => {
                switch (pos) {
                  case 'CHAMPION': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                  case 'RUNNER_UP': return 'text-gray-600 bg-gray-50 border-gray-200';
                  case 'THIRD_PLACE': return 'text-amber-600 bg-amber-50 border-amber-200';
                  default: return 'text-blue-600 bg-blue-50 border-blue-200';
                }
              };

              return (
                <div
                  key={position}
                  className={`border rounded-lg p-3 text-center ${getPositionColor(position)}`}
                >
                  <div className="font-medium text-sm mb-1">
                    {positionNames[position]}
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    +{reward}
                  </div>
                  <div className="text-xs opacity-75">
                    điểm ELO
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Lợi ích của hệ thống mới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-primary">Cho người chơi</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Dễ hiểu và tính toán điểm ELO</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Thăng hạng ngay khi đủ điểm</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Không bị giới hạn bởi thời gian chờ</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                  <span>Công bằng với K-factor cố định</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-primary">Cho hệ thống</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Giảm lỗi tính toán phức tạp</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Dễ bảo trì và cập nhật</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Minh bạch và nhất quán</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  <span>Tự động hóa hoàn toàn</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};