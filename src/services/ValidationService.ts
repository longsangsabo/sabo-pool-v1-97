import { TournamentFormData, TournamentValidationErrors } from '@/types/tournament-extended';
import { TournamentTier, TournamentType, GameFormat } from '@/types/tournament-enums';
import { PARTICIPANT_SLOTS, AVAILABLE_RANKS } from '@/schemas/tournamentSchema';

export interface ValidationResult {
  isValid: boolean;
  errors: TournamentValidationErrors;
  warnings: string[];
}

export class ValidationService {
  /**
   * Comprehensive tournament data validation
   */
  static validateTournamentData(data: Partial<TournamentFormData>): ValidationResult {
    const errors: TournamentValidationErrors = {};
    const warnings: string[] = [];

    // Basic info validation
    this.validateBasicInfo(data, errors);
    
    // Tournament settings validation
    this.validateTournamentSettings(data, errors, warnings);
    
    // Schedule validation
    this.validateSchedule(data, errors, warnings);
    
    // Registration settings validation
    this.validateRegistrationSettings(data, errors);
    
    // Rank eligibility validation
    this.validateRankEligibility(data, errors);
    
    // Business logic validation
    this.validateBusinessLogic(data, errors, warnings);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Real-time field validation for forms
   */
  static validateField(fieldName: keyof TournamentFormData, value: any, formData?: Partial<TournamentFormData>): string | null {
    switch (fieldName) {
      case 'name':
        return this.validateTournamentName(value);
      
      case 'venue_address':
        return this.validateVenueAddress(value);
      
      case 'max_participants':
        return this.validateMaxParticipants(value);
      
      case 'entry_fee':
        return this.validateEntryFee(value);
      
      case 'tournament_start':
        return this.validateTournamentStart(value);
      
      case 'tournament_end':
        return this.validateTournamentEnd(value, formData?.tournament_start);
      
      case 'registration_start':
        return this.validateRegistrationStart(value);
      
      case 'registration_end':
        return this.validateRegistrationEnd(value, formData?.tournament_start);
      
      case 'contact_info':
        return this.validateContactInfo(value);
      
      case 'eligible_ranks':
        return this.validateEligibleRanks(value, formData?.allow_all_ranks);
      
      default:
        return null;
    }
  }

  /**
   * Validate tournament creation constraints
   */
  static validateTournamentCreation(data: TournamentFormData, userRole: string, clubStatus?: string): ValidationResult {
    const baseValidation = this.validateTournamentData(data);
    const errors = { ...baseValidation.errors };
    const warnings = [...baseValidation.warnings];

    // User permission validation
    if (userRole !== 'club_owner' && userRole !== 'admin') {
      errors.permissions = 'Chỉ chủ CLB hoặc admin mới có thể tạo giải đấu';
    }

    // Club status validation
    if (clubStatus !== 'verified' && userRole === 'club_owner') {
      warnings.push('CLB chưa được xác minh. Giải đấu sẽ cần được phê duyệt.');
    }

    // Entry fee constraints
    if (data.entry_fee > 1000000) {
      warnings.push('Phí đăng ký cao có thể làm giảm số lượng người tham gia');
    }

    // Participant limit warnings
    if (data.max_participants > 32) {
      warnings.push('Giải đấu lớn cần nhiều thời gian và nhân lực quản lý');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate schedule conflicts
   */
  static validateScheduleConflicts(
    data: TournamentFormData, 
    existingTournaments: Array<{ tournament_start: string; tournament_end: string; venue_address: string }>
  ): string[] {
    const conflicts: string[] = [];
    const newStart = new Date(data.tournament_start);
    const newEnd = new Date(data.tournament_end);

    for (const existing of existingTournaments) {
      const existingStart = new Date(existing.tournament_start);
      const existingEnd = new Date(existing.tournament_end);

      // Check time overlap
      const timeOverlap = (newStart < existingEnd) && (newEnd > existingStart);

      // Check venue conflict (same or similar address)
      const venueConflict = this.isSimilarVenue(data.venue_address, existing.venue_address);

      if (timeOverlap && venueConflict) {
        conflicts.push(`Trùng lịch với giải đấu khác tại ${existing.venue_address}`);
      }
    }

    return conflicts;
  }

  /**
   * Private validation methods
   */
  private static validateBasicInfo(data: Partial<TournamentFormData>, errors: TournamentValidationErrors): void {
    // Tournament name
    if (!data.name?.trim()) {
      errors.name = 'Tên giải đấu là bắt buộc';
    } else if (data.name.trim().length < 3) {
      errors.name = 'Tên giải đấu phải có ít nhất 3 ký tự';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Tên giải đấu không được vượt quá 100 ký tự';
    }

    // Description
    if (data.description && data.description.length > 1000) {
      errors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }

    // Venue address
    if (!data.venue_address?.trim()) {
      errors.venue_address = 'Địa điểm tổ chức là bắt buộc';
    } else if (data.venue_address.trim().length < 5) {
      errors.venue_address = 'Địa điểm phải có ít nhất 5 ký tự';
    }

    // Tier level
    if (data.tier_level !== undefined && !Object.values(TournamentTier).includes(data.tier_level)) {
      errors.tier_level = 'Hạng giải không hợp lệ';
    }
  }

  private static validateTournamentSettings(
    data: Partial<TournamentFormData>, 
    errors: TournamentValidationErrors,
    warnings: string[]
  ): void {
    // Max participants
    if (data.max_participants !== undefined) {
      if (data.max_participants < 4) {
        errors.max_participants = 'Tối thiểu 4 người tham gia';
      } else if (data.max_participants > 64) {
        errors.max_participants = 'Tối đa 64 người tham gia';
      } else if (!PARTICIPANT_SLOTS.includes(data.max_participants as any)) {
        errors.max_participants = 'Số lượng tham gia phải là 4, 6, 8, 12, 16, 24 hoặc 32';
      }
    }

    // Tournament type
    if (data.tournament_type && !Object.values(TournamentType).includes(data.tournament_type)) {
      errors.tournament_type = 'Loại giải đấu không hợp lệ';
    }

    // Game format
    if (data.game_format && !Object.values(GameFormat).includes(data.game_format)) {
      errors.game_format = 'Môn thi đấu không hợp lệ';
    }

    // Entry fee
    if (data.entry_fee !== undefined) {
      if (data.entry_fee < 0) {
        errors.entry_fee = 'Phí đăng ký không được âm';
      } else if (data.entry_fee > 5000000) {
        warnings.push('Phí đăng ký rất cao, có thể ảnh hưởng đến số lượng đăng ký');
      }
    }

    // Prize pool
    if (data.prize_pool !== undefined && data.prize_pool < 0) {
      errors.prize_pool = 'Giải thưởng không được âm';
    }
  }

  private static validateSchedule(
    data: Partial<TournamentFormData>, 
    errors: TournamentValidationErrors,
    warnings: string[]
  ): void {
    const now = new Date();

    // Tournament start time
    if (data.tournament_start) {
      const startDate = new Date(data.tournament_start);
      if (startDate <= now) {
        errors.tournament_start = 'Thời gian bắt đầu phải sau thời điểm hiện tại';
      } else if (startDate < new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
        warnings.push('Giải đấu bắt đầu trong vòng 24 giờ, thời gian chuẩn bị có thể không đủ');
      }
    }

    // Tournament end time
    if (data.tournament_start && data.tournament_end) {
      const startDate = new Date(data.tournament_start);
      const endDate = new Date(data.tournament_end);
      
      if (endDate <= startDate) {
        errors.tournament_end = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }

      // Check duration reasonableness
      const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      if (durationHours < 4) {
        warnings.push('Thời gian giải đấu có thể quá ngắn');
      } else if (durationHours > 72) {
        warnings.push('Giải đấu kéo dài hơn 3 ngày có thể cần nhiều nhân lực');
      }
    }
  }

  private static validateRegistrationSettings(data: Partial<TournamentFormData>, errors: TournamentValidationErrors): void {
    // Registration start
    if (data.registration_start) {
      const regStart = new Date(data.registration_start);
      const now = new Date();
      
      if (regStart > new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        errors.registration_start = 'Thời gian mở đăng ký không nên quá 30 ngày';
      }
    }

    // Registration end vs tournament start
    if (data.registration_end && data.tournament_start) {
      const regEnd = new Date(data.registration_end);
      const tournamentStart = new Date(data.tournament_start);
      
      if (regEnd > tournamentStart) {
        errors.registration_end = 'Thời gian đóng đăng ký phải trước khi giải đấu bắt đầu';
      }

      // Warning for very short registration period
      const timeDiff = tournamentStart.getTime() - regEnd.getTime();
      if (timeDiff < 2 * 60 * 60 * 1000) { // Less than 2 hours
        errors.registration_end = 'Nên có ít nhất 2 giờ giữa đóng đăng ký và bắt đầu thi đấu';
      }
    }

    // Contact info
    if (data.contact_info && data.contact_info.trim().length < 5) {
      errors.contact_info = 'Thông tin liên hệ phải có ít nhất 5 ký tự';
    }
  }

  private static validateRankEligibility(data: Partial<TournamentFormData>, errors: TournamentValidationErrors): void {
    if (!data.allow_all_ranks) {
      if (!data.eligible_ranks || data.eligible_ranks.length === 0) {
        errors.eligible_ranks = 'Vui lòng chọn ít nhất một hạng hoặc cho phép tất cả hạng';
      } else {
        // Validate rank codes
        const invalidRanks = data.eligible_ranks.filter(rank => !AVAILABLE_RANKS.includes(rank as any));
        if (invalidRanks.length > 0) {
          errors.eligible_ranks = `Hạng không hợp lệ: ${invalidRanks.join(', ')}`;
        }
      }
    }

    // Validate min/max rank requirements
    if (data.min_rank_requirement && !AVAILABLE_RANKS.includes(data.min_rank_requirement as any)) {
      errors.min_rank_requirement = 'Hạng tối thiểu không hợp lệ';
    }

    if (data.max_rank_requirement && !AVAILABLE_RANKS.includes(data.max_rank_requirement as any)) {
      errors.max_rank_requirement = 'Hạng tối đa không hợp lệ';
    }
  }

  private static validateBusinessLogic(
    data: Partial<TournamentFormData>, 
    errors: TournamentValidationErrors,
    warnings: string[]
  ): void {
    // Prize pool vs entry fee logic
    if (data.entry_fee !== undefined && data.max_participants !== undefined) {
      const totalRevenue = data.entry_fee * data.max_participants;
      
      if (data.prize_pool !== undefined && data.prize_pool > totalRevenue) {
        warnings.push('Giải thưởng vượt quá tổng thu từ phí đăng ký');
      }
    }

    // Tournament type vs participant count
    if (data.tournament_type === TournamentType.ROUND_ROBIN && data.max_participants && data.max_participants > 8) {
      warnings.push('Giải vòng tròn với nhiều người tham gia sẽ mất rất nhiều thời gian');
    }
  }

  // Individual field validators
  private static validateTournamentName(name: string): string | null {
    if (!name?.trim()) return 'Tên giải đấu là bắt buộc';
    if (name.trim().length < 3) return 'Tên giải đấu phải có ít nhất 3 ký tự';
    if (name.trim().length > 100) return 'Tên giải đấu không được vượt quá 100 ký tự';
    return null;
  }

  private static validateVenueAddress(address: string): string | null {
    if (!address?.trim()) return 'Địa điểm tổ chức là bắt buộc';
    if (address.trim().length < 5) return 'Địa điểm phải có ít nhất 5 ký tự';
    return null;
  }

  private static validateMaxParticipants(count: number): string | null {
    if (count < 4) return 'Tối thiểu 4 người tham gia';
    if (count > 64) return 'Tối đa 64 người tham gia';
    if (!PARTICIPANT_SLOTS.includes(count as any)) {
      return 'Số lượng tham gia phải là 4, 6, 8, 12, 16, 24 hoặc 32';
    }
    return null;
  }

  private static validateEntryFee(fee: number): string | null {
    if (fee < 0) return 'Phí đăng ký không được âm';
    return null;
  }

  private static validateTournamentStart(startTime: string): string | null {
    const startDate = new Date(startTime);
    const now = new Date();
    
    if (startDate <= now) {
      return 'Thời gian bắt đầu phải sau thời điểm hiện tại';
    }
    return null;
  }

  private static validateTournamentEnd(endTime: string, startTime?: string): string | null {
    if (!startTime) return null;
    
    const endDate = new Date(endTime);
    const startDate = new Date(startTime);
    
    if (endDate <= startDate) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    return null;
  }

  private static validateRegistrationStart(regStart: string): string | null {
    const regStartDate = new Date(regStart);
    const now = new Date();
    
    if (regStartDate > new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      return 'Thời gian mở đăng ký không nên quá 30 ngày';
    }
    return null;
  }

  private static validateRegistrationEnd(regEnd: string, tournamentStart?: string): string | null {
    if (!tournamentStart) return null;
    
    const regEndDate = new Date(regEnd);
    const tournamentStartDate = new Date(tournamentStart);
    
    if (regEndDate > tournamentStartDate) {
      return 'Thời gian đóng đăng ký phải trước khi giải đấu bắt đầu';
    }

    const timeDiff = tournamentStartDate.getTime() - regEndDate.getTime();
    if (timeDiff < 2 * 60 * 60 * 1000) {
      return 'Nên có ít nhất 2 giờ giữa đóng đăng ký và bắt đầu thi đấu';
    }
    
    return null;
  }

  private static validateContactInfo(contactInfo: string): string | null {
    if (contactInfo && contactInfo.trim().length < 5) {
      return 'Thông tin liên hệ phải có ít nhất 5 ký tự';
    }
    return null;
  }

  private static validateEligibleRanks(ranks: string[], allowAllRanks?: boolean): string | null {
    if (!allowAllRanks && (!ranks || ranks.length === 0)) {
      return 'Vui lòng chọn ít nhất một hạng hoặc cho phép tất cả hạng';
    }
    
    if (ranks) {
      const invalidRanks = ranks.filter(rank => !AVAILABLE_RANKS.includes(rank as any));
      if (invalidRanks.length > 0) {
        return `Hạng không hợp lệ: ${invalidRanks.join(', ')}`;
      }
    }
    
    return null;
  }

  private static isSimilarVenue(venue1: string, venue2: string): boolean {
    // Simple similarity check - can be enhanced with more sophisticated matching
    const clean1 = venue1.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const clean2 = venue2.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Check if addresses are similar (contains same significant parts)
    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
      word.length > 3 && words2.some(w => w.includes(word) || word.includes(w))
    );
    
    return commonWords.length >= 2; // If 2+ significant words match, consider similar
  }
}