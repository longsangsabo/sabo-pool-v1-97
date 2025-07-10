import { RANK_ELO, FIXED_K_FACTOR, type RankCode } from './eloConstants';

// Danh sách các hạng theo thứ tự
export const RANK_ORDER: RankCode[] = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'];

// Export RankCode type for external use
export type { RankCode };

/**
 * Lấy hạng tiếp theo
 */
export function getNextRank(currentRank: RankCode): RankCode | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex === -1 || currentIndex === RANK_ORDER.length - 1) {
    return null; // Đã ở hạng cao nhất
  }
  return RANK_ORDER[currentIndex + 1];
}

/**
 * Lấy hạng trước đó
 */
export function getPreviousRank(currentRank: RankCode): RankCode | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex <= 0) {
    return null; // Đã ở hạng thấp nhất
  }
  return RANK_ORDER[currentIndex - 1];
}

/**
 * Lấy hạng dựa trên điểm ELO
 */
export function getRankByElo(elo: number): RankCode {
  // Tìm hạng cao nhất mà người chơi đủ điều kiện
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const rank = RANK_ORDER[i];
    if (elo >= RANK_ELO[rank]) {
      return rank;
    }
  }
  return 'K'; // Mặc định
}

/**
 * Kiểm tra đủ điều kiện thăng hạng - Đơn giản hóa: chỉ cần ELO đủ
 */
export function isEligibleForPromotion(
  currentElo: number, 
  currentRank: RankCode
): boolean {
  // Kiểm tra điểm ELO đủ để thăng hạng
  const nextRank = getNextRank(currentRank);
  if (!nextRank) {
    return false; // Đã ở hạng cao nhất
  }
  
  return currentElo >= RANK_ELO[nextRank];
}

/**
 * Tính ELO mới sau trận đấu - Đơn giản hóa với K-factor cố định
 */
export function calculateNewElo(
  playerElo: number, 
  opponentElo: number, 
  result: number // 1 = thắng, 0.5 = hòa, 0 = thua
): number {
  const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const eloChange = FIXED_K_FACTOR * (result - expectedResult);
  
  return Math.round(playerElo + eloChange);
}

/**
 * Tính thay đổi ELO (không áp dụng vào ELO hiện tại)
 */
export function calculateEloChange(
  playerElo: number, 
  opponentElo: number, 
  result: number
): number {
  const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(FIXED_K_FACTOR * (result - expectedResult));
}

/**
 * Tính phần trăm tiến độ đến hạng tiếp theo
 */
export function calculateRankProgress(currentElo: number, currentRank: RankCode): {
  currentRankElo: number;
  nextRankElo: number | null;
  progress: number;
  pointsNeeded: number;
} {
  const currentRankElo = RANK_ELO[currentRank];
  const nextRank = getNextRank(currentRank);
  
  if (!nextRank) {
    return {
      currentRankElo,
      nextRankElo: null,
      progress: 100,
      pointsNeeded: 0
    };
  }
  
  const nextRankElo = RANK_ELO[nextRank];
  const totalPointsNeeded = nextRankElo - currentRankElo;
  const pointsEarned = Math.max(0, currentElo - currentRankElo);
  const progress = Math.min(100, (pointsEarned / totalPointsNeeded) * 100);
  const pointsNeeded = Math.max(0, nextRankElo - currentElo);
  
  return {
    currentRankElo,
    nextRankElo,
    progress,
    pointsNeeded
  };
}

/**
 * Định dạng hiển thị hạng
 */
export function formatRankDisplay(rank: RankCode): string {
  const rankNames = {
    'K': 'Hạng K',
    'K+': 'Hạng K+',
    'I': 'Hạng I',
    'I+': 'Hạng I+',
    'H': 'Hạng H',
    'H+': 'Hạng H+',
    'G': 'Hạng G',
    'G+': 'Hạng G+',
    'F': 'Hạng F',
    'F+': 'Hạng F+',
    'E': 'Hạng E',
    'E+': 'Hạng E+'
  };
  
  return rankNames[rank] || rank;
}

/**
 * Lấy màu sắc cho hạng
 */
export function getRankColor(rank: RankCode): string {
  const colors = {
    'K': 'text-slate-600',
    'K+': 'text-slate-500', 
    'I': 'text-amber-600',
    'I+': 'text-amber-500',
    'H': 'text-green-600', 
    'H+': 'text-green-500',
    'G': 'text-blue-600',
    'G+': 'text-blue-500',
    'F': 'text-purple-600',
    'F+': 'text-purple-500',
    'E': 'text-red-600',
    'E+': 'text-red-500'
  };
  
  return colors[rank] || 'text-slate-600';
}