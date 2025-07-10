import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Trophy, Star, Calculator } from 'lucide-react';
import { RANK_ELO, TOURNAMENT_ELO_REWARDS, FIXED_K_FACTOR } from '@/utils/eloConstants';
import { formatRankDisplay, getRankColor } from '@/utils/rankUtils';

interface ELORulesModalProps {
  trigger?: React.ReactNode;
}

export const ELORulesModal: React.FC<ELORulesModalProps> = ({ trigger }) => {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Info className="w-4 h-4" />
      Quy định ELO
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Quy định hệ thống ELO - Đã đơn giản hóa
          </DialogTitle>
          <DialogDescription>
            Hệ thống ELO mới với K-factor cố định và tự động thăng hạng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thay đổi mới */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Cập nhật mới - Hệ thống đơn giản hóa
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>✅ <strong>K-factor cố định:</strong> Tất cả người chơi đều sử dụng K-factor = {FIXED_K_FACTOR}</p>
              <p>✅ <strong>Thăng hạng tự động:</strong> Chỉ cần đủ điểm ELO là thăng hạng ngay lập tức</p>
              <p>✅ <strong>Không giới hạn:</strong> Bỏ yêu cầu số trận tối thiểu và thời gian chờ</p>
              <p>✅ <strong>Đơn giản hơn:</strong> Dễ hiểu và minh bạch hơn cho người chơi</p>
            </div>
          </div>

          {/* Bảng hạng và điểm ELO */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Bảng hạng và điểm ELO yêu cầu
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(RANK_ELO).map(([rankCode, eloPoints]) => (
                <div
                  key={rankCode}
                  className="bg-card border rounded-lg p-3 text-center"
                >
                  <div className={`font-bold text-lg ${getRankColor(rankCode as any)}`}>
                    {formatRankDisplay(rankCode as any)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {eloPoints}+ điểm
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tính toán ELO trận đấu */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Tính toán ELO trận đấu
            </h3>
            <div className="bg-card border rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <p><strong>Công thức:</strong> ELO mới = ELO cũ + K × (Kết quả thực tế - Kết quả dự đoán)</p>
                <p><strong>K-factor:</strong> {FIXED_K_FACTOR} (cố định cho tất cả người chơi)</p>
                <p><strong>Kết quả:</strong> Thắng = 1, Hòa = 0.5, Thua = 0</p>
              </div>
              
              <div className="bg-muted rounded p-3">
                <p className="text-sm font-medium mb-2">Ví dụ:</p>
                <p className="text-xs text-muted-foreground">
                  Người chơi A (ELO: 1500) đấu với người chơi B (ELO: 1400)
                  <br />
                  Nếu A thắng: A nhận khoảng +13 ELO, B mất khoảng -13 ELO
                  <br />
                  Nếu B thắng: B nhận khoảng +19 ELO, A mất khoảng -19 ELO
                </p>
              </div>
            </div>
          </div>

          {/* Phần thưởng giải đấu */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Phần thưởng ELO giải đấu
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                
                return (
                  <div
                    key={position}
                    className="bg-card border rounded-lg p-3 text-center"
                  >
                    <div className="font-medium text-sm mb-1">
                      {positionNames[position]}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      +{reward}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      điểm ELO
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lợi ích hệ thống mới */}
          <div>
            <h3 className="font-semibold mb-3">Lợi ích của hệ thống mới</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Cho người chơi:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Dễ hiểu và tính toán</li>
                  <li>• Thăng hạng nhanh chóng khi đủ điểm</li>
                  <li>• Không bị giới hạn bởi thời gian chờ</li>
                  <li>• Công bằng cho tất cả mọi người</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Cho hệ thống:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Giảm lỗi tính toán phức tạp</li>
                  <li>• Dễ bảo trì và cập nhật</li>
                  <li>• Minh bạch và nhất quán</li>
                  <li>• Tự động hóa hoàn toàn</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};