import { TournamentStatus, TournamentType, GameFormat, TournamentTier, PaymentStatus, RegistrationStatus } from './tournament-enums';
import type { RankCode } from '@/utils/eloConstants';

// Extended tournament types with rewards and full structure
export interface TournamentRewards {
  totalPrize: number;
  showPrizes: boolean;
  positions: RewardPosition[];
  specialAwards: SpecialAward[];
}

export interface RewardPosition {
  position: number;
  name: string;
  eloPoints: number;
  spaPoints: number;
  cashPrize: number;
  items: string[];
  isVisible: boolean;
}

export interface SpecialAward {
  id: string;
  name: string;
  description?: string;
  cashPrize: number;
  criteria?: string;
}

// Enhanced Tournament interface extending the existing one
export interface EnhancedTournament {
  id: string;
  name: string;
  description?: string;
  tournament_type: TournamentType;
  game_format: GameFormat;
  tier_level: TournamentTier;
  max_participants: number;
  current_participants: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string;
  club_id?: string;
  venue_address: string;
  entry_fee: number;
  prize_pool: number;
  status: TournamentStatus;
  rules?: string;
  contact_info?: string;
  banner_image?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  has_third_place_match?: boolean;
  
  // Extended fields
  rewards: TournamentRewards;
  eligible_ranks: RankCode[];
  allow_all_ranks: boolean;
  min_rank_requirement?: RankCode;
  max_rank_requirement?: RankCode;
  requires_approval: boolean;
  is_public: boolean;
  
  // Calculated fields
  available_slots: number;
  registration_status: 'not_started' | 'open' | 'closed' | 'ended';
  time_until_start?: string;
  
  // Relations (optional, loaded when needed)
  club?: {
    id: string;
    name: string;
    address: string;
  };
  
  registrations?: TournamentRegistration[];
  organizer?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  player_id: string;
  registration_date: string;
  registration_status: RegistrationStatus;
  payment_status: PaymentStatus;
  notes?: string;
  added_by_admin?: string;
  admin_notes?: string;
  
  // Player info (loaded when needed)
  player?: {
    id: string;
    full_name: string;
    display_name?: string;
    current_rank: RankCode;
    elo: number;
    avatar_url?: string;
  };
}

// Form data interface for tournament creation
export interface TournamentFormData {
  // Basic info
  name: string;
  description?: string;
  tier_level: TournamentTier;
  tournament_start: string;
  tournament_end: string;
  venue_address: string;
  
  // Tournament settings
  max_participants: number;
  tournament_type: TournamentType;
  game_format: GameFormat;
  entry_fee: number;
  prize_pool: number;
  has_third_place_match?: boolean;
  
  // Registration settings
  registration_start: string;
  registration_end: string;
  rules?: string;
  contact_info?: string;
  
  // Rank eligibility
  eligible_ranks: RankCode[];
  allow_all_ranks: boolean;
  min_rank_requirement?: RankCode;
  max_rank_requirement?: RankCode;
  requires_approval: boolean;
  is_public: boolean;
  
  // Rewards (optional for form, will be calculated)
  rewards?: TournamentRewards;
}

// Helper types for state management
export interface TournamentDraft extends Partial<TournamentFormData> {
  id?: string;
  lastModified: string;
  isValid: boolean;
  step: number;
}

export interface TournamentValidationErrors {
  [key: string]: string | string[] | undefined;
}

// API response types
export interface TournamentListResponse {
  tournaments: EnhancedTournament[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TournamentDetailResponse extends EnhancedTournament {
  registrations: TournamentRegistration[];
  organizerInfo: {
    id: string;
    name: string;
    role: string;
    contact: string;
  };
  clubInfo?: {
    id: string;
    name: string;
    address: string;
    contact: string;
    verified: boolean;
  };
}