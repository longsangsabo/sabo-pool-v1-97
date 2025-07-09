import { TournamentRewards, RewardPosition, SpecialAward } from '@/types/tournament-extended';
import { TournamentTier, GameFormat } from '@/types/tournament-enums';
import { RankCode } from '@/utils/eloConstants';
import { RankingService } from './rankingService';

export class RewardsService {
  /**
   * Calculate tournament rewards based on parameters
   */
  static calculateRewards(
    tier: TournamentTier,
    entryFee: number,
    maxParticipants: number,
    gameFormat: GameFormat
  ): TournamentRewards {
    const totalRevenue = entryFee * maxParticipants;
    const prizePercentage = this.getPrizePercentage(tier);
    const totalPrize = Math.round(totalRevenue * prizePercentage);

    // Generate positions based on participant count
    const positions = this.generatePositions(tier, gameFormat, totalPrize, maxParticipants);

    return {
      totalPrize,
      showPrizes: entryFee > 0,
      positions,
      specialAwards: this.generateSpecialAwards(tier, totalRevenue),
    };
  }

  /**
   * Recalculate rewards when tournament parameters change
   */
  static recalculateRewards(
    currentRewards: TournamentRewards,
    tier: TournamentTier,
    entryFee: number,
    maxParticipants: number,
    gameFormat: GameFormat,
    preserveCustomizations: boolean = true
  ): TournamentRewards {
    const baseRewards = this.calculateRewards(tier, entryFee, maxParticipants, gameFormat);

    if (!preserveCustomizations) {
      return baseRewards;
    }

    // Preserve custom modifications to positions
    const updatedPositions = baseRewards.positions.map(basePosition => {
      const existingPosition = currentRewards.positions.find(p => p.position === basePosition.position);
      
      if (existingPosition) {
        return {
          ...basePosition,
          // Preserve custom cash prizes if they were modified
          cashPrize: existingPosition.cashPrize !== this.getDefaultCashPrize(basePosition.position, baseRewards.totalPrize)
            ? existingPosition.cashPrize
            : basePosition.cashPrize,
          // Preserve custom items
          items: existingPosition.items.length > 0 ? existingPosition.items : basePosition.items,
          // Preserve visibility settings
          isVisible: existingPosition.isVisible,
        };
      }

      return basePosition;
    });

    return {
      ...baseRewards,
      positions: updatedPositions,
      specialAwards: [
        ...baseRewards.specialAwards,
        ...currentRewards.specialAwards.filter(award => 
          !baseRewards.specialAwards.some(base => base.id === award.id)
        ),
      ],
    };
  }

  /**
   * Validate rewards configuration
   */
  static validateRewards(rewards: TournamentRewards, maxParticipants: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check total prize distribution
    const totalCashDistributed = rewards.positions.reduce((sum, pos) => sum + pos.cashPrize, 0);
    const specialAwardTotal = rewards.specialAwards.reduce((sum, award) => sum + award.cashPrize, 0);
    const totalAwarded = totalCashDistributed + specialAwardTotal;

    if (totalAwarded > rewards.totalPrize) {
      errors.push(`Tổng tiền thưởng vượt quá ngân sách (${totalAwarded.toLocaleString()} > ${rewards.totalPrize.toLocaleString()})`);
    }

    if (totalAwarded < rewards.totalPrize * 0.8) {
      warnings.push(`Chỉ phân phối ${((totalAwarded / rewards.totalPrize) * 100).toFixed(1)}% tổng giải thưởng`);
    }

    // Check position validity
    const validPositions = this.getValidPositions(maxParticipants);
    const invalidPositions = rewards.positions.filter(pos => !validPositions.includes(pos.position));
    
    if (invalidPositions.length > 0) {
      errors.push(`Vị trí không hợp lệ với ${maxParticipants} người tham gia: ${invalidPositions.map(p => p.position).join(', ')}`);
    }

    // Check for negative values
    const negativeValues = rewards.positions.filter(pos => 
      pos.eloPoints < 0 || pos.spaPoints < 0 || pos.cashPrize < 0
    );
    
    if (negativeValues.length > 0) {
      errors.push('Không được có giá trị âm trong phần thưởng');
    }

    // Check for missing essential positions
    if (!rewards.positions.some(p => p.position === 1)) {
      errors.push('Phải có giải nhất');
    }

    if (maxParticipants >= 4 && !rewards.positions.some(p => p.position === 2)) {
      warnings.push('Nên có giải nhì cho giải đấu từ 4 người trở lên');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate tournament template rewards
   */
  static generateTemplateRewards(templateType: 'basic' | 'premium' | 'championship'): Partial<TournamentRewards> {
    const templates = {
      basic: {
        positions: [
          { position: 1, items: ['Cúp', 'Giấy khen'] },
          { position: 2, items: ['Huy chương bạc'] },
          { position: 3, items: ['Huy chương đồng'] },
        ],
        specialAwards: [],
      },
      premium: {
        positions: [
          { position: 1, items: ['Cúp vàng', 'Giấy khen', 'Áo phông'] },
          { position: 2, items: ['Cúp bạc', 'Giấy khen'] },
          { position: 3, items: ['Cúp đồng', 'Giấy khen'] },
          { position: 4, items: ['Giấy khen'] },
        ],
        specialAwards: [
          {
            id: 'best-break',
            name: 'Break xuất sắc nhất',
            description: 'Người có break đẹp nhất giải',
            cashPrize: 0,
          },
        ],
      },
      championship: {
        positions: [
          { position: 1, items: ['Cúp vô địch', 'Huy chương vàng', 'Áo phông', 'Que tặng'] },
          { position: 2, items: ['Cúp á quân', 'Huy chương bạc', 'Áo phông'] },
          { position: 3, items: ['Cúp hạng ba', 'Huy chương đồng', 'Áo phông'] },
          { position: 4, items: ['Huy chương khuyến khích'] },
        ],
        specialAwards: [
          {
            id: 'best-break',
            name: 'Break xuất sắc nhất',
            description: 'Người có break đẹp nhất giải',
            cashPrize: 0,
          },
          {
            id: 'highest-run',
            name: 'Combo cao nhất',
            description: 'Người có combo cao nhất trong giải',
            cashPrize: 0,
          },
          {
            id: 'fair-play',
            name: 'Tinh thần fair-play',
            description: 'Người chơi có tinh thần thể thao cao',
            cashPrize: 0,
          },
        ],
      },
    };

    return templates[templateType];
  }

  /**
   * Get SPA points multiplier based on rank
   */
  static getSpaPointsForRank(rank: RankCode, position: number): number {
    try {
      // Use the existing RankingService if available
      if (RankingService && RankingService.calculateTournamentSpa) {
        const tournamentPosition = this.mapPositionToTournamentPosition(position);
        return RankingService.calculateTournamentSpa(tournamentPosition, rank);
      }
    } catch (error) {
      console.warn('RankingService not available, using fallback calculation');
    }

    // Fallback calculation
    const rankMultipliers = {
      'K': 0.8, 'K+': 0.9,
      'I': 1.0, 'I+': 1.1,
      'H': 1.2, 'H+': 1.3,
      'G': 1.4, 'G+': 1.5,
      'F': 1.6, 'F+': 1.7,
      'E': 1.8, 'E+': 2.0,
    };

    const basePoints = {
      1: 1000,
      2: 800,
      3: 600,
      4: 400,
      8: 200,
      16: 100,
    };

    const multiplier = rankMultipliers[rank] || 1.0;
    const base = basePoints[position as keyof typeof basePoints] || 50;

    return Math.round(base * multiplier);
  }

  /**
   * Private helper methods
   */
  private static getPrizePercentage(tier: TournamentTier): number {
    const percentages = {
      [TournamentTier.K]: 0.70, // 70% for K tier
      [TournamentTier.I]: 0.75, // 75% for I tier
      [TournamentTier.H]: 0.80, // 80% for H tier
      [TournamentTier.G]: 0.85, // 85% for G tier
    };

    return percentages[tier] || 0.75;
  }

  private static generatePositions(
    tier: TournamentTier,
    gameFormat: GameFormat,
    totalPrize: number,
    maxParticipants: number
  ): RewardPosition[] {
    const positions: RewardPosition[] = [];
    const validPositions = this.getValidPositions(maxParticipants);
    const distribution = this.getPrizeDistribution(maxParticipants);

    for (const position of validPositions) {
      const eloPoints = this.getEloPoints(tier, gameFormat, position);
      const spaPoints = this.getSpaPoints(tier, position);
      const cashPrize = Math.round(totalPrize * (distribution[position] || 0));
      const items = this.getDefaultItems(position);

      positions.push({
        position,
        name: this.getPositionName(position),
        eloPoints,
        spaPoints,
        cashPrize,
        items,
        isVisible: true,
      });
    }

    return positions;
  }

  private static getValidPositions(maxParticipants: number): number[] {
    if (maxParticipants >= 32) return [1, 2, 3, 4, 8, 16];
    if (maxParticipants >= 16) return [1, 2, 3, 4, 8];
    if (maxParticipants >= 8) return [1, 2, 3, 4];
    if (maxParticipants >= 4) return [1, 2, 3];
    return [1, 2];
  }

  private static getPrizeDistribution(maxParticipants: number): Record<number, number> {
    // Prize distribution based on participant count
    if (maxParticipants >= 16) {
      return { 1: 0.40, 2: 0.25, 3: 0.15, 4: 0.10, 8: 0.10 };
    } else if (maxParticipants >= 8) {
      return { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.10 };
    } else if (maxParticipants >= 4) {
      return { 1: 0.50, 2: 0.30, 3: 0.20 };
    } else {
      return { 1: 0.60, 2: 0.40 };
    }
  }

  private static getEloPoints(tier: TournamentTier, gameFormat: GameFormat, position: number): number {
    const basePoints = {
      1: 100, 2: 60, 3: 40, 4: 25, 8: 15, 16: 10
    };

    const tierMultiplier = {
      [TournamentTier.K]: 1.0,
      [TournamentTier.I]: 1.2,
      [TournamentTier.H]: 1.4,
      [TournamentTier.G]: 1.6,
    };

    const gameMultiplier = {
      [GameFormat.NINE_BALL]: 1.0,
      [GameFormat.EIGHT_BALL]: 0.9,
      [GameFormat.TEN_BALL]: 1.1,
      [GameFormat.STRAIGHT_POOL]: 1.2,
    };

    const base = basePoints[position as keyof typeof basePoints] || 5;
    const tier_mult = tierMultiplier[tier] || 1.0;
    const game_mult = gameMultiplier[gameFormat] || 1.0;

    return Math.round(base * tier_mult * game_mult);
  }

  private static getSpaPoints(tier: TournamentTier, position: number): number {
    const basePoints = {
      [TournamentTier.K]: { 1: 900, 2: 700, 3: 500, 4: 350, 8: 200, 16: 100 },
      [TournamentTier.I]: { 1: 1000, 2: 800, 3: 600, 4: 400, 8: 250, 16: 120 },
      [TournamentTier.H]: { 1: 1200, 2: 950, 3: 700, 4: 450, 8: 300, 16: 150 },
      [TournamentTier.G]: { 1: 1500, 2: 1200, 3: 900, 4: 600, 8: 400, 16: 200 },
    };

    return basePoints[tier]?.[position as keyof typeof basePoints[TournamentTier]] || 50;
  }

  private static getDefaultItems(position: number): string[] {
    const items = {
      1: ['Cúp vô địch', 'Bằng khen'],
      2: ['Huy chương bạc'],
      3: ['Huy chương đồng'],
      4: [],
      8: [],
      16: [],
    };

    return items[position as keyof typeof items] || [];
  }

  private static getPositionName(position: number): string {
    const names = {
      1: 'Vô địch',
      2: 'Á quân', 
      3: 'Hạng ba',
      4: 'Hạng tư',
      8: 'Top 8',
      16: 'Top 16',
    };

    return names[position as keyof typeof names] || `Hạng ${position}`;
  }

  private static generateSpecialAwards(tier: TournamentTier, totalRevenue: number): SpecialAward[] {
    // Only generate special awards for higher tiers and larger tournaments
    if (tier < TournamentTier.H || totalRevenue < 1000000) {
      return [];
    }

    return [
      {
        id: 'best-break',
        name: 'Break xuất sắc nhất',
        description: 'Người có break đẹp nhất trong giải đấu',
        cashPrize: Math.round(totalRevenue * 0.02), // 2% of total revenue
      },
    ];
  }

  private static getDefaultCashPrize(position: number, totalPrize: number): number {
    const distribution = { 1: 0.40, 2: 0.25, 3: 0.15, 4: 0.10, 8: 0.10 };
    return Math.round(totalPrize * (distribution[position as keyof typeof distribution] || 0));
  }

  private static mapPositionToTournamentPosition(position: number): any {
    const positionMap = {
      1: 'CHAMPION',
      2: 'RUNNER_UP',
      3: 'THIRD_PLACE',
      4: 'FOURTH_PLACE',
      8: 'TOP_8',
      16: 'TOP_16',
    };

    return positionMap[position as keyof typeof positionMap] || 'PARTICIPATION';
  }
}