import { z } from 'zod';

// Tournament tier types - Extended for all ranks
export const TOURNAMENT_TIERS = {
  E: { name: 'Giải Hạng E+', minFee: 2000000, maxFee: 10000000, description: 'Giải đấu chuyên nghiệp cao nhất', level: 4 },
  'E+': { name: 'Giải Hạng E', minFee: 1000000, maxFee: 5000000, description: 'Giải đấu chuyên nghiệp', level: 4 },
  F: { name: 'Giải Hạng F+', minFee: 800000, maxFee: 3000000, description: 'Giải đấu xuất sắc cao', level: 3 },
  'F+': { name: 'Giải Hạng F', minFee: 600000, maxFee: 2000000, description: 'Giải đấu xuất sắc', level: 3 },
  G: { name: 'Giải Hạng G+', minFee: 400000, maxFee: 1500000, description: 'Giải đấu khá cao', level: 2 },
  'G+': { name: 'Giải Hạng G', minFee: 300000, maxFee: 1000000, description: 'Giải đấu khá', level: 2 },
  H: { name: 'Giải Hạng H+', minFee: 200000, maxFee: 800000, description: 'Giải đấu trung cấp cao', level: 2 },
  'H+': { name: 'Giải Hạng H', minFee: 150000, maxFee: 600000, description: 'Giải đấu trung cấp', level: 2 },
  I: { name: 'Giải Hạng I+', minFee: 100000, maxFee: 400000, description: 'Giải đấu cơ bản cao', level: 1 },
  'I+': { name: 'Giải Hạng I', minFee: 80000, maxFee: 300000, description: 'Giải đấu cơ bản', level: 1 },
  K: { name: 'Giải Hạng K+', minFee: 50000, maxFee: 200000, description: 'Giải đấu cho người mới cao', level: 1 },
  'K+': { name: 'Giải Hạng K', minFee: 30000, maxFee: 150000, description: 'Giải đấu cho người mới', level: 1 },
} as const;

export type TournamentTierType = keyof typeof TOURNAMENT_TIERS;

// Available participant slots
export const PARTICIPANT_SLOTS = [4, 6, 8, 12, 16, 24, 32] as const;

// Tournament format types
export const TOURNAMENT_FORMATS = {
  single_elimination: 'Loại trực tiếp',
  double_elimination: 'Loại kép', 
  round_robin: 'Vòng tròn',
  swiss: 'Swiss System'
} as const;

// Game formats
export const GAME_FORMATS = {
  '8_ball': '8-Ball',
  '9_ball': '9-Ball', 
  '10_ball': '10-Ball',
  straight_pool: 'Straight Pool'
} as const;

// Validation schema
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
  
  tier: z.enum(['E', 'E+', 'F', 'F+', 'G', 'G+', 'H', 'H+', 'I', 'I+', 'K', 'K+'], {
    required_error: 'Vui lòng chọn hạng giải',
  }),
  
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
    .max(32, 'Tối đa 32 người tham gia')
    .refine((val) => PARTICIPANT_SLOTS.includes(val as any), {
      message: 'Số lượng tham gia phải là 4, 6, 8, 12, 16, 24 hoặc 32',
    }),
  
  tournament_type: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss'], {
    required_error: 'Vui lòng chọn hình thức thi đấu',
  }),
  
  game_format: z.enum(['8_ball', '9_ball', '10_ball', 'straight_pool'], {
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
  const tier = TOURNAMENT_TIERS[data.tier];
  return data.entry_fee >= tier.minFee && data.entry_fee <= tier.maxFee;
}, {
  message: 'Phí đăng ký không phù hợp với hạng giải',
  path: ['entry_fee'],
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
    tier: 'I',
    max_participants: 16,
    tournament_type: 'single_elimination',
    game_format: '9_ball',
    entry_fee: 100000,
    prize_pool: 0,
    registration_start: now.toISOString().slice(0, 16),
    registration_end: tomorrow.toISOString().slice(0, 16),
    tournament_start: nextWeek.toISOString().slice(0, 16),
    tournament_end: nextWeek.toISOString().slice(0, 16),
    requires_approval: false,
    is_public: true,
  };
};