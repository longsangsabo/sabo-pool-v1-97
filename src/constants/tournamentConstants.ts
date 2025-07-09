// Tournament status constants
export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  UPCOMING: 'upcoming',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type TournamentStatus = typeof TOURNAMENT_STATUS[keyof typeof TOURNAMENT_STATUS];

// Tournament type constants
export const TOURNAMENT_TYPE = {
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  SWISS: 'swiss'
} as const;

export type TournamentType = typeof TOURNAMENT_TYPE[keyof typeof TOURNAMENT_TYPE];

// Tournament registration status
export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  WAITLISTED: 'waitlisted'
} as const;

export type RegistrationStatus = typeof REGISTRATION_STATUS[keyof typeof REGISTRATION_STATUS];

// Payment status constants
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Tournament tier constants
export const TOURNAMENT_TIER = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional',
  CHAMPIONSHIP: 'championship'
} as const;

export type TournamentTier = typeof TOURNAMENT_TIER[keyof typeof TOURNAMENT_TIER];

// Tournament format constants
export const TOURNAMENT_FORMAT = {
  RACE_TO_5: 'race_to_5',
  RACE_TO_7: 'race_to_7',
  RACE_TO_9: 'race_to_9',
  BEST_OF_3: 'best_of_3',
  BEST_OF_5: 'best_of_5'
} as const;

export type TournamentFormat = typeof TOURNAMENT_FORMAT[keyof typeof TOURNAMENT_FORMAT];

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const;

export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];

// Seeding method constants
export const SEEDING_METHOD = {
  ELO_RANKING: 'elo_ranking',
  REGISTRATION_ORDER: 'registration_order',
  RANDOM: 'random',
  MANUAL: 'manual'
} as const;

export type SeedingMethod = typeof SEEDING_METHOD[keyof typeof SEEDING_METHOD];

// Tournament visibility constants
export const TOURNAMENT_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  CLUB_ONLY: 'club_only'
} as const;

export type TournamentVisibility = typeof TOURNAMENT_VISIBILITY[keyof typeof TOURNAMENT_VISIBILITY];

// Default tournament settings
export const TOURNAMENT_DEFAULTS = {
  MAX_PARTICIPANTS: 64,
  MIN_PARTICIPANTS: 4,
  DEFAULT_ENTRY_FEE: 0,
  DEFAULT_FORMAT: TOURNAMENT_FORMAT.RACE_TO_5,
  DEFAULT_TYPE: TOURNAMENT_TYPE.SINGLE_ELIMINATION,
  DEFAULT_TIER: TOURNAMENT_TIER.BEGINNER,
  DEFAULT_VISIBILITY: TOURNAMENT_VISIBILITY.PUBLIC,
  REGISTRATION_BUFFER_HOURS: 2, // Hours before tournament start when registration closes
  AUTO_START_DELAY_MINUTES: 15 // Minutes after scheduled start to auto-start tournament
} as const;

// Tournament status display mapping
export const TOURNAMENT_STATUS_DISPLAY = {
  [TOURNAMENT_STATUS.DRAFT]: 'Nháp',
  [TOURNAMENT_STATUS.UPCOMING]: 'Sắp diễn ra',
  [TOURNAMENT_STATUS.REGISTRATION_OPEN]: 'Đang mở đăng ký',
  [TOURNAMENT_STATUS.REGISTRATION_CLOSED]: 'Đã đóng đăng ký',
  [TOURNAMENT_STATUS.ONGOING]: 'Đang diễn ra',
  [TOURNAMENT_STATUS.COMPLETED]: 'Đã kết thúc',
  [TOURNAMENT_STATUS.CANCELLED]: 'Đã hủy'
} as const;

// Tournament type display mapping
export const TOURNAMENT_TYPE_DISPLAY = {
  [TOURNAMENT_TYPE.SINGLE_ELIMINATION]: 'Loại trực tiếp',
  [TOURNAMENT_TYPE.DOUBLE_ELIMINATION]: 'Loại kép',
  [TOURNAMENT_TYPE.ROUND_ROBIN]: 'Vòng tròn',
  [TOURNAMENT_TYPE.SWISS]: 'Swiss'
} as const;

// Tournament permissions
export const TOURNAMENT_PERMISSIONS = {
  CREATE: 'tournament:create',
  UPDATE: 'tournament:update',
  DELETE: 'tournament:delete',
  MANAGE_REGISTRATIONS: 'tournament:manage_registrations',
  MANAGE_BRACKET: 'tournament:manage_bracket',
  FINALIZE_RESULTS: 'tournament:finalize_results'
} as const;