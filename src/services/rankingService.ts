import { 
  TOURNAMENT_ELO_REWARDS, 
  SPA_TOURNAMENT_REWARDS, 
  FIXED_K_FACTOR, 
  RANK_ELO
} from '@/utils/eloConstants';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

export class RankingService {
  /**
   * Calculate tournament ELO reward based on position
   */
  static calculateTournamentElo(position: TournamentPosition): number {
    return TOURNAMENT_ELO_REWARDS[position] || TOURNAMENT_ELO_REWARDS.PARTICIPATION;
  }

  /**
   * Calculate tournament SPA reward based on position and player rank
   */
  static calculateTournamentSpa(position: TournamentPosition, playerRank: RankCode): number {
    const rankRewards = SPA_TOURNAMENT_REWARDS[playerRank] || SPA_TOURNAMENT_REWARDS.K;
    return rankRewards[position] || rankRewards.PARTICIPATION;
  }

  /**
   * Calculate match ELO change using simplified ELO formula with fixed K-factor
   */
  static calculateMatchElo(
    playerElo: number, 
    opponentElo: number, 
    result: number // 1 for win, 0 for loss, 0.5 for draw
  ): number {
    const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const eloChange = FIXED_K_FACTOR * (result - expectedResult);
    
    return Math.round(playerElo + eloChange);
  }

  /**
   * Calculate ELO change amount (without applying to current ELO)
   */
  static calculateEloChange(
    playerElo: number,
    opponentElo: number,
    result: number
  ): number {
    const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    
    return Math.round(FIXED_K_FACTOR * (result - expectedResult));
  }

  /**
   * Check if player is eligible for rank promotion - Simplified: only check ELO
   */
  static isEligibleForPromotion(
    currentElo: number,
    currentRank: RankCode
  ): boolean {
    // Check if ELO qualifies for next rank
    const nextRank = this.getNextRank(currentRank);
    if (!nextRank) return false; // Already at highest rank

    const requiredElo = RANK_ELO[nextRank];
    return currentElo >= requiredElo;
  }

  /**
   * Get the next rank above current rank
   */
  static getNextRank(currentRank: RankCode): RankCode | null {
    const rankOrder: RankCode[] = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'];
    const currentIndex = rankOrder.indexOf(currentRank);
    
    if (currentIndex === -1 || currentIndex === rankOrder.length - 1) {
      return null; // Invalid rank or already at highest
    }
    
    return rankOrder[currentIndex + 1];
  }

  /**
   * Get rank based on ELO points
   */
  static getRankByElo(elo: number): RankCode {
    if (elo >= 2100) return 'E+';
    if (elo >= 2000) return 'E';
    if (elo >= 1900) return 'F+';
    if (elo >= 1800) return 'F';
    if (elo >= 1700) return 'G+';
    if (elo >= 1600) return 'G';
    if (elo >= 1500) return 'H+';
    if (elo >= 1400) return 'H';
    if (elo >= 1300) return 'I+';
    if (elo >= 1200) return 'I';
    if (elo >= 1100) return 'K+';
    return 'K';
  }

  /**
   * Calculate tournament rewards summary
   */
  static calculateTournamentRewards(position: TournamentPosition, playerRank: RankCode) {
    return {
      eloPoints: this.calculateTournamentElo(position),
      spaPoints: this.calculateTournamentSpa(position, playerRank),
      position,
      rank: playerRank
    };
  }

  /**
   * Get all possible tournament positions
   */
  static getTournamentPositions(): TournamentPosition[] {
    return ['CHAMPION', 'RUNNER_UP', 'THIRD_PLACE', 'FOURTH_PLACE', 'TOP_8', 'TOP_16', 'PARTICIPATION'];
  }

  /**
   * Format position for display
   */
  static formatPosition(position: TournamentPosition): string {
    const positionMap: Record<TournamentPosition, string> = {
      CHAMPION: 'Vô địch',
      RUNNER_UP: 'Á quân',
      THIRD_PLACE: 'Hạng 3',
      FOURTH_PLACE: 'Hạng 4',
      TOP_8: 'Top 8',
      TOP_16: 'Top 16',
      PARTICIPATION: 'Tham gia'
    };
    
    return positionMap[position] || position;
  }
}