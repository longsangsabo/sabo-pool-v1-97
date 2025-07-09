import { 
  TOURNAMENT_ELO_REWARDS, 
  SPA_TOURNAMENT_REWARDS, 
  K_FACTORS, 
  RANK_ELO,
  RANK_PROMOTION_REQUIREMENTS 
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
   * Calculate match ELO change using standard ELO formula
   */
  static calculateMatchElo(
    playerElo: number, 
    opponentElo: number, 
    result: number, // 1 for win, 0 for loss, 0.5 for draw
    matchCount: number
  ): number {
    const kFactor = this.determineKFactor(playerElo, matchCount);
    const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const eloChange = kFactor * (result - expectedResult);
    
    return Math.round(playerElo + eloChange);
  }

  /**
   * Calculate ELO change amount (without applying to current ELO)
   */
  static calculateEloChange(
    playerElo: number,
    opponentElo: number,
    result: number,
    matchCount: number
  ): number {
    const kFactor = this.determineKFactor(playerElo, matchCount);
    const expectedResult = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    
    return Math.round(kFactor * (result - expectedResult));
  }

  /**
   * Determine K-factor based on ELO and match count
   */
  static determineKFactor(elo: number, matchCount: number): number {
    if (matchCount < 30) return K_FACTORS.NEW_PLAYER;
    if (elo >= 2400) return K_FACTORS.MASTER;
    if (elo >= 2100) return K_FACTORS.ADVANCED;
    return K_FACTORS.REGULAR;
  }

  /**
   * Check if player is eligible for rank promotion
   */
  static isEligibleForPromotion(
    currentElo: number,
    currentRank: RankCode,
    matchCount: number,
    lastPromotionDate?: Date
  ): boolean {
    // Check minimum matches requirement
    if (matchCount < RANK_PROMOTION_REQUIREMENTS.MIN_MATCHES) {
      return false;
    }

    // Check time since last promotion
    if (lastPromotionDate) {
      const daysSincePromotion = Math.floor(
        (Date.now() - lastPromotionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePromotion < RANK_PROMOTION_REQUIREMENTS.MIN_DAYS_BETWEEN_PROMOTIONS) {
        return false;
      }
    }

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