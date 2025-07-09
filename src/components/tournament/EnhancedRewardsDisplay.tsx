import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Star, Users, Gift, DollarSign, Info, Edit, Coins } from 'lucide-react';
import { TournamentRewards } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

interface EnhancedRewardsDisplayProps {
  rewards: TournamentRewards;
  rank?: RankCode;
  entryFee?: number;
  maxParticipants?: number;
  onEdit?: () => void;
  isEditable?: boolean;
  showFinancialSummary?: boolean;
}

const PositionIcon = ({ position }: { position: number }) => {
  const iconMap: Record<number, React.ReactNode> = {
    1: <Trophy className="w-5 h-5 text-yellow-500" />,
    2: <Medal className="w-5 h-5 text-gray-400" />,
    3: <Award className="w-5 h-5 text-amber-600" />,
    4: <Star className="w-5 h-5 text-blue-500" />,
    8: <Users className="w-5 h-5 text-green-500" />,
    16: <Users className="w-5 h-5 text-purple-500" />,
  };
  
  return iconMap[position] || <Gift className="w-5 h-5 text-gray-500" />;
};

export const EnhancedRewardsDisplay: React.FC<EnhancedRewardsDisplayProps> = ({
  rewards,
  rank,
  entryFee = 0,
  maxParticipants = 0,
  onEdit,
  isEditable = false,
  showFinancialSummary = true,
}) => {
  const totalRevenue = entryFee * maxParticipants;
  const clubProfit = totalRevenue - rewards.totalPrize;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Tổng giải thưởng</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              {rewards.totalPrize.toLocaleString('vi-VN')}₫
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Điểm ELO cao nhất</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              +{Math.max(...rewards.positions.map(p => p.eloPoints))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Điểm SPA cao nhất</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              +{Math.max(...rewards.positions.map(p => p.spaPoints)).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Vị trí có thưởng</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {rewards.positions.filter(p => p.isVisible).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Rewards Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Chi tiết phần thưởng {rank && `- Hạng ${rank}`}
            </CardTitle>
            {isEditable && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2">Vị trí</th>
                  <th className="text-left py-3 px-2">Điểm thưởng</th>
                  <th className="text-left py-3 px-2">Tiền mặt</th>
                  <th className="text-left py-3 px-2">Hiện vật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rewards.positions
                  .filter(p => p.isVisible)
                  .map((position) => (
                    <tr key={position.position} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <PositionIcon position={position.position} />
                          <div>
                            <div className="font-medium">{position.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Vị trí #{position.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            +{position.eloPoints} ELO
                          </Badge>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                            +{position.spaPoints.toLocaleString()} SPA
                          </Badge>
                        </div>
                      </td>
                      
                      <td className="py-4 px-2">
                        {position.cashPrize > 0 ? (
                          <span className="font-semibold text-green-600">
                            {position.cashPrize.toLocaleString('vi-VN')}₫
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-2">
                        {position.items && position.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {position.items.map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Special Awards */}
      {rewards.specialAwards && rewards.specialAwards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-purple-500" />
              Giải thưởng đặc biệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.specialAwards.map((award) => (
                <div key={award.id} className="p-4 rounded-lg border bg-purple-50/50 border-purple-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-purple-900">{award.name}</h4>
                    <span className="text-sm font-bold text-green-600">
                      {award.cashPrize.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  {award.description && (
                    <p className="text-sm text-purple-700">{award.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {showFinancialSummary && entryFee > 0 && maxParticipants > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
              Tổng quan tài chính
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {totalRevenue.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-blue-700">Tổng thu</div>
                <div className="text-xs text-muted-foreground">
                  {maxParticipants} × {entryFee.toLocaleString('vi-VN')}₫
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {rewards.totalPrize.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-yellow-700">Giải thưởng</div>
                <div className="text-xs text-muted-foreground">
                  {((rewards.totalPrize / totalRevenue) * 100).toFixed(1)}% tổng thu
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className={`text-2xl font-bold ${clubProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {clubProfit.toLocaleString('vi-VN')}₫
                </div>
                <div className="text-sm text-green-700">Lợi nhuận CLB</div>
                <div className="text-xs text-muted-foreground">
                  {((clubProfit / totalRevenue) * 100).toFixed(1)}% tổng thu
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <Info className="w-4 h-4" />
            Thông tin quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">ELO</Badge>
              <span>Điểm chính thức, ảnh hưởng trực tiếp đến hạng của bạn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">SPA</Badge>
              <span>Điểm "vui", không ảnh hưởng hạng chính thức nhưng có thể đổi quà</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Hạng</Badge>
              <span>Điểm SPA phụ thuộc vào hạng hiện tại - hạng cao hơn = SPA nhiều hơn</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">Vị trí</Badge>
              <span>Điểm ELO cố định theo vị trí cuối cùng trong giải đấu</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRewardsDisplay;