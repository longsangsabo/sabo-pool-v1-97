// ELO và SPA Points constants cho SABO Pool Arena

export const RANK_ELO = {
  'K': 1000,
  'K+': 1100,
  'I': 1200,
  'I+': 1300,
  'H': 1400,
  'H+': 1500,
  'G': 1600,
  'G+': 1700,
  'F': 1800,
  'F+': 1900,
  'E': 2000,
  'E+': 2100,
} as const;

export const K_FACTORS = {
  NEW_PLAYER: 40,  // <30 trận
  REGULAR: 32,     // ELO <2100
  ADVANCED: 24,    // ELO <2400
  MASTER: 16       // ELO ≥2400
} as const;

export const TOURNAMENT_ELO_REWARDS = {
  CHAMPION: 100,
  RUNNER_UP: 50,
  THIRD_PLACE: 25,
  FOURTH_PLACE: 12.5,
  TOP_8: 6,
  TOP_16: 3,
  PARTICIPATION: 1
} as const;

export const SPA_TOURNAMENT_REWARDS = {
  'E': { 
    CHAMPION: 1500, 
    RUNNER_UP: 1100, 
    THIRD_PLACE: 900, 
    FOURTH_PLACE: 650, 
    TOP_8: 320, 
    PARTICIPATION: 120 
  },
  'F': { 
    CHAMPION: 1350, 
    RUNNER_UP: 1000, 
    THIRD_PLACE: 800, 
    FOURTH_PLACE: 550, 
    TOP_8: 280, 
    PARTICIPATION: 110 
  },
  'G': { 
    CHAMPION: 1200, 
    RUNNER_UP: 900, 
    THIRD_PLACE: 700, 
    FOURTH_PLACE: 500, 
    TOP_8: 250, 
    PARTICIPATION: 100 
  },
  'H': { 
    CHAMPION: 1100, 
    RUNNER_UP: 850, 
    THIRD_PLACE: 650, 
    FOURTH_PLACE: 450, 
    TOP_8: 200, 
    PARTICIPATION: 100 
  },
  'I': { 
    CHAMPION: 1000, 
    RUNNER_UP: 800, 
    THIRD_PLACE: 600, 
    FOURTH_PLACE: 400, 
    TOP_8: 150, 
    PARTICIPATION: 100 
  },
  'K': { 
    CHAMPION: 900, 
    RUNNER_UP: 700, 
    THIRD_PLACE: 500, 
    FOURTH_PLACE: 350, 
    TOP_8: 120, 
    PARTICIPATION: 100 
  }
} as const;

export const SPA_CHALLENGE_REWARDS = {
  WIN: 50,
  LOSS: 10,
  STREAK_BONUS: 25, // Per consecutive win
  COMEBACK_BONUS: 100, // When winning from behind
  DAILY_LIMIT: 500 // Maximum SPA per day from challenges
} as const;

export const RANK_PROMOTION_REQUIREMENTS = {
  MIN_MATCHES: 4,
  MIN_DAYS_BETWEEN_PROMOTIONS: 7
} as const;

export type RankCode = keyof typeof RANK_ELO;
export type TournamentPosition = keyof typeof TOURNAMENT_ELO_REWARDS;