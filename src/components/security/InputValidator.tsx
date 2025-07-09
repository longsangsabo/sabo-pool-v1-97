import { z } from 'zod';
import { toast } from 'sonner';

// Payment validation schemas
export const paymentSchemas = {
  createPayment: z.object({
    amount: z.number()
      .min(10000, 'Số tiền tối thiểu là 10,000 VNĐ')
      .max(50000000, 'Số tiền tối đa là 50,000,000 VNĐ'),
    type: z.enum(['membership', 'wallet_deposit', 'tournament_fee', 'club_payment']),
    paymentMethod: z.enum(['vnpay', 'momo', 'zalopay', 'bank_transfer']).optional(),
    description: z.string().min(1, 'Mô tả không được trống').max(200, 'Mô tả quá dài'),
  }),

  refund: z.object({
    transactionId: z.string().uuid('ID giao dịch không hợp lệ'),
    amount: z.number().min(1, 'Số tiền hoàn phải lớn hơn 0'),
    reason: z.string().min(10, 'Lý do hoàn tiền phải ít nhất 10 ký tự').max(500, 'Lý do quá dài'),
  }),
};

// User validation schemas
export const userSchemas = {
  profile: z.object({
    full_name: z.string()
      .min(2, 'Tên phải ít nhất 2 ký tự')
      .max(50, 'Tên không được quá 50 ký tự')
      .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng'),
    phone: z.string()
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
    email: z.string().email('Email không hợp lệ').optional(),
    bio: z.string().max(500, 'Tiểu sử không được quá 500 ký tự').optional(),
  }),

  login: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
  }),

  register: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string()
      .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa chữ hoa, chữ thường và số'),
    full_name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
    phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  }),
};

// Tournament validation schemas
export const tournamentSchemas = {
  create: z.object({
    name: z.string().min(5, 'Tên giải đấu phải ít nhất 5 ký tự').max(100, 'Tên quá dài'),
    description: z.string().max(1000, 'Mô tả quá dài'),
    max_participants: z.number().min(4, 'Tối thiểu 4 người tham gia').max(128, 'Tối đa 128 người'),
    entry_fee: z.number().min(0, 'Phí tham gia không được âm').max(10000000, 'Phí tham gia quá cao'),
    tournament_start: z.string().datetime('Thời gian bắt đầu không hợp lệ'),
    tournament_end: z.string().datetime('Thời gian kết thúc không hợp lệ'),
    registration_end: z.string().datetime('Thời gian đăng ký không hợp lệ'),
  }),
};

// File validation
export const fileSchemas = {
  image: z.object({
    file: z.any()
      .refine((file) => file instanceof File, 'Phải là file hợp lệ')
      .refine((file) => file.size <= 5 * 1024 * 1024, 'File không được quá 5MB')
      .refine(
        (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
        'Chỉ chấp nhận file JPG, PNG, WEBP'
      ),
  }),

  document: z.object({
    file: z.any()
      .refine((file) => file instanceof File, 'Phải là file hợp lệ')
      .refine((file) => file.size <= 10 * 1024 * 1024, 'File không được quá 10MB')
      .refine(
        (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
        'Chỉ chấp nhận file PDF, JPG, PNG'
      ),
  }),
};

// XSS Protection
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// SQL Injection Protection (for display purposes)
export const sanitizeSQL = (input: string): string => {
  return input
    .replace(/['";\\]/g, '') // Remove dangerous SQL characters
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER)\b/gi, '') // Remove SQL keywords
    .trim();
};

// General validation hook
export const useInputValidation = () => {
  const validate = (schema: z.ZodSchema<any>, data: unknown): any | null => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Dữ liệu không hợp lệ');
      }
      return null;
    }
  };

  const validateAsync = async (schema: z.ZodSchema<any>, data: unknown): Promise<any | null> => {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error('Dữ liệu không hợp lệ');
      }
      return null;
    }
  };

  return { validate, validateAsync, sanitizeInput, sanitizeSQL };
};

// Form validation helper
export const createFormValidator = (schema: z.ZodSchema<any>) => {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      return { success: false, errors };
    }
    return { success: true, data: result.data };
  };
};