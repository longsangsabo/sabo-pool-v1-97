
import { z } from 'zod';
import { TournamentType, GameFormat, TournamentTier } from '@/types/tournament-enums';

// Available participant slots
export const PARTICIPANT_SLOTS = [4, 6, 8, 12, 16, 24, 32] as const;

// Tournament format types (backward compatible)
export const TOURNAMENT_FORMATS = {
  single_elimination: 'Loại trực tiếp',
  double_elimination: 'Loại kép', 
  round_robin: 'Vòng tròn',
  swiss: 'Swiss System'
} as const;

// Game formats (backward compatible)
export const GAME_FORMATS = {
  '8_ball': '8-Ball',
  '9_ball': '9-Ball', 
  '10_ball': '10-Ball',
  straight_pool: 'Straight Pool'
} as const;

// Available ranks for tournaments
export const AVAILABLE_RANKS = [
  'K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'
] as const;

// Validation schema - using tier_level instead of hardcoded tiers
export const tournamentSchema = z.object({
  // Basic info (Step 1)
  name: z
    .string()
    .min(3, 'Tên giải đấu phải có ít nhất 3 ký tự')
    .max(100, 'Tên giải đấu không được vượt quá 100 ký tự'),
  
  description: z
    .string()
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  
  tier_level: z
    .number()
    .min(1, 'Vui lòng chọn hạng giải')
    .max(4, 'Hạng giải không hợp lệ'),
  
  tournament_start: z
    .string()
    .min(1, 'Vui lòng chọn thời gian bắt đầu')
    .refine((date) => new Date(date) > new Date(), {
      message: 'Thời gian bắt đầu phải sau thời điểm hiện tại',
    }),
  
  tournament_end: z
    .string()
    .min(1, 'Vui lòng chọn thời gian kết thúc'),
  
  venue_address: z
    .string()
    .min(5, 'Địa điểm phải có ít nhất 5 ký tự'),

  // Tournament settings (Step 2)
  max_participants: z
    .number()
    .min(4, 'Tối thiểu 4 người tham gia')
    .max(64, 'Tối đa 64 người tham gia')
    .refine((val) => PARTICIPANT_SLOTS.includes(val as any), {
      message: 'Số lượng tham gia phải là 4, 6, 8, 12, 16, 24 hoặc 32',
    }),
  
  tournament_type: z.nativeEnum(TournamentType, {
    required_error: 'Vui lòng chọn hình thức thi đấu',
  }),
  
  game_format: z.nativeEnum(GameFormat, {
    required_error: 'Vui lòng chọn môn thi đấu',
  }),
  
  entry_fee: z
    .number()
    .min(0, 'Phí đăng ký không được âm'),
  
  prize_pool: z
    .number()
    .min(0, 'Giải thưởng không được âm'),

  // Registration settings (Step 3)
  registration_start: z
    .string()
    .min(1, 'Vui lòng chọn thời gian mở đăng ký'),
  
  registration_end: z
    .string()
    .min(1, 'Vui lòng chọn thời gian đóng đăng ký'),
  
  rules: z
    .string()
    .max(2000, 'Luật lệ không được vượt quá 2000 ký tự')
    .optional(),
  
  contact_info: z
    .string()
    .min(5, 'Thông tin liên hệ phải có ít nhất 5 ký tự')
    .optional(),
    
  // Rank eligibility
  eligible_ranks: z
    .array(z.enum(['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+']))
    .optional(),
  
  allow_all_ranks: z.boolean().default(false),
  
  min_rank_requirement: z.string().optional(),
  max_rank_requirement: z.string().optional(),
  requires_approval: z.boolean().default(false),
  is_public: z.boolean().default(true),
}).refine((data) => {
  return new Date(data.tournament_end) > new Date(data.tournament_start);
}, {
  message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
  path: ['tournament_end'],
}).refine((data) => {
  return new Date(data.registration_end) <= new Date(data.tournament_start);
}, {
  message: 'Thời gian đóng đăng ký phải trước khi giải đấu bắt đầu',
  path: ['registration_end'],
}).refine((data) => {
  // Validate rank eligibility
  if (!data.allow_all_ranks && (!data.eligible_ranks || data.eligible_ranks.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Vui lòng chọn ít nhất một hạng hoặc cho phép tất cả hạng',
  path: ['eligible_ranks'],
});

export type TournamentFormData = z.infer<typeof tournamentSchema>;

// Default values
export const getDefaultTournamentData = (): Partial<TournamentFormData> => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    tier_level: TournamentTier.K,
    max_participants: 16,
    tournament_type: TournamentType.SINGLE_ELIMINATION,
    game_format: GameFormat.NINE_BALL,
    entry_fee: 100000,
    prize_pool: 0,
    registration_start: now.toISOString().slice(0, 16),
    registration_end: tomorrow.toISOString().slice(0, 16),
    tournament_start: nextWeek.toISOString().slice(0, 16),
    tournament_end: nextWeek.toISOString().slice(0, 16),
    eligible_ranks: [],
    allow_all_ranks: true,
    requires_approval: false,
    is_public: true,
  };
};
