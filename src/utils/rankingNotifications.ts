import { toast } from '@/hooks/use-toast';
import { formatRankDisplay, type RankCode } from './rankUtils';

export interface RankPromotionData {
  oldRank: RankCode;
  newRank: RankCode;
  newElo: number;
}

export interface EloEarnedData {
  earnedElo: number;
  source: string;
  newTotal: number;
}

export interface SPAEarnedData {
  earnedSpa: number;
  source: string;
  newTotal: number;
}

/**
 * Hiển thị thông báo khi thăng hạng
 */
export function showRankPromotionNotification({ oldRank, newRank, newElo }: RankPromotionData) {
  toast({
    title: "🎉 Chúc mừng!",
    description: `Bạn đã thăng hạng từ ${formatRankDisplay(oldRank)} lên ${formatRankDisplay(newRank)}! ELO hiện tại: ${newElo}`,
    duration: 8000,
    className: "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600",
  });
}

/**
 * Hiển thị thông báo khi nhận điểm ELO
 */
export function showEloEarnedNotification({ earnedElo, source, newTotal }: EloEarnedData) {
  const isPositive = earnedElo > 0;
  const emoji = isPositive ? "⬆️" : "⬇️";
  const color = isPositive ? "from-blue-500 to-blue-600" : "from-red-500 to-red-600";
  
  toast({
    title: `${emoji} ELO ${isPositive ? 'tăng' : 'giảm'}!`,
    description: `${isPositive ? '+' : ''}${earnedElo} điểm ELO từ ${source}. Tổng: ${newTotal}`,
    duration: 5000,
    className: `bg-gradient-to-r ${color} text-white`,
  });
}

/**
 * Hiển thị thông báo khi nhận SPA Points
 */
export function showSPAEarnedNotification({ earnedSpa, source, newTotal }: SPAEarnedData) {
  const emoji = "⭐";
  
  toast({
    title: `${emoji} SPA Points!`,
    description: `+${earnedSpa} SPA Points từ ${source}. Tổng: ${newTotal.toLocaleString('vi-VN')}`,
    duration: 4000,
    className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-600",
  });
}

/**
 * Hiển thị thông báo cảnh báo khi gần đạt giới hạn SPA hàng ngày
 */
export function showSPADailyLimitWarning(currentDaily: number, limit: number) {
  const remaining = limit - currentDaily;
  
  if (remaining <= 100 && remaining > 0) {
    toast({
      title: "⚠️ Gần đạt giới hạn SPA",
      description: `Còn ${remaining} SPA Points có thể kiếm hôm nay từ thách đấu`,
      duration: 6000,
      className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    });
  } else if (remaining <= 0) {
    toast({
      title: "🚫 Đã đạt giới hạn SPA",
      description: "Bạn đã kiếm đủ SPA Points từ thách đấu hôm nay. Quay lại vào ngày mai!",
      duration: 6000,
      className: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    });
  }
}

/**
 * Hiển thị thông báo milestone đạt được
 */
export function showMilestoneCompletedNotification(milestoneName: string, reward: string) {
  toast({
    title: "🏆 Milestone hoàn thành!",
    description: `Bạn đã đạt được "${milestoneName}". Phần thưởng: ${reward}`,
    duration: 7000,
    className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600",
  });
}

/**
 * Hiển thị thông báo chuỗi thắng
 */
export function showWinStreakNotification(streakCount: number, bonusPoints: number) {
  toast({
    title: "🔥 Chuỗi thắng!",
    description: `${streakCount} trận thắng liên tiếp! Bonus: +${bonusPoints} SPA Points`,
    duration: 5000,
    className: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
  });
}

/**
 * Hiển thị thông báo comeback
 */
export function showComebackNotification(bonusPoints: number) {
  toast({
    title: "💪 Comeback thành công!",
    description: `Thắng ngược từ thế bất lợi! Bonus: +${bonusPoints} SPA Points`,
    duration: 6000,
    className: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
  });
}