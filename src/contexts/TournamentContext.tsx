import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TournamentFormData, TournamentDraft, TournamentValidationErrors, TournamentRewards, EnhancedTournament } from '@/types/tournament-extended';
import { TournamentTier, TournamentType, GameFormat } from '@/types/tournament-enums';
import { RankCode } from '@/utils/eloConstants';
import { toast } from 'sonner';

interface TournamentContextType {
  // Current tournament state
  tournament: TournamentFormData | null;
  isDraft: boolean;
  isValid: boolean;
  currentStep: number;
  validationErrors: TournamentValidationErrors;
  
  // Draft management
  draft: TournamentDraft | null;
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
  
  // Tournament operations
  updateTournament: (data: Partial<TournamentFormData>) => void;
  updateRewards: (rewards: TournamentRewards) => void;
  validateTournament: () => boolean;
  resetTournament: () => void;
  
  // Form navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Auto-calculation
  calculateRewards: () => TournamentRewards;
  recalculateOnChange: boolean;
  setRecalculateOnChange: (value: boolean) => void;
  
  // Actions
  createTournament: () => Promise<EnhancedTournament | null>;
  updateExistingTournament: (id: string) => Promise<EnhancedTournament | null>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Default tournament data
const getDefaultTournamentData = (): TournamentFormData => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    name: '',
    description: '',
    tier_level: TournamentTier.K,
    max_participants: 16,
    tournament_type: TournamentType.SINGLE_ELIMINATION,
    game_format: GameFormat.NINE_BALL,
    entry_fee: 100000,
    prize_pool: 0,
    has_third_place_match: true,
    registration_start: now.toISOString().slice(0, 16),
    registration_end: tomorrow.toISOString().slice(0, 16),
    tournament_start: nextWeek.toISOString().slice(0, 16),
    tournament_end: nextWeek.toISOString().slice(0, 16),
    venue_address: '',
    eligible_ranks: [],
    allow_all_ranks: true,
    requires_approval: false,
    is_public: true,
  };
};

// Auto-calculate rewards based on tournament parameters
const calculateTournamentRewards = (
  tier: TournamentTier, 
  entryFee: number, 
  maxParticipants: number,
  gameFormat: GameFormat
): TournamentRewards => {
  const totalRevenue = entryFee * maxParticipants;
  const prizePercentage = 0.75; // 75% of revenue goes to prizes
  const totalPrize = Math.round(totalRevenue * prizePercentage);
  
  // Prize distribution percentages
  const distribution = {
    1: 0.5,    // 50% for champion
    2: 0.3,    // 30% for runner-up
    3: 0.15,   // 15% for 3rd place
    4: 0.05,   // 5% for 4th place
  };
  
  // ELO points based on tier and game format
  const tierMultiplier = {
    [TournamentTier.K]: 1.0,
    [TournamentTier.I]: 1.2,
    [TournamentTier.H]: 1.4,
    [TournamentTier.G]: 1.6,
  };
  
  const baseEloPoints = {
    1: 100,
    2: 60,
    3: 40,
    4: 25,
    8: 15,
    16: 10,
  };
  
  const multiplier = tierMultiplier[tier];
  
  const positions = [
    {
      position: 1,
      name: 'Vô địch',
      eloPoints: Math.round(baseEloPoints[1] * multiplier),
      spaPoints: getSpaPoints(tier, 1),
      cashPrize: Math.round(totalPrize * distribution[1]),
      items: ['Cúp vô địch', 'Bằng khen'],
      isVisible: true,
    },
    {
      position: 2,
      name: 'Á quân',
      eloPoints: Math.round(baseEloPoints[2] * multiplier),
      spaPoints: getSpaPoints(tier, 2),
      cashPrize: Math.round(totalPrize * distribution[2]),
      items: ['Huy chương bạc'],
      isVisible: true,
    },
    {
      position: 3,
      name: 'Hạng ba',
      eloPoints: Math.round(baseEloPoints[3] * multiplier),
      spaPoints: getSpaPoints(tier, 3),
      cashPrize: Math.round(totalPrize * distribution[3]),
      items: ['Huy chương đồng'],
      isVisible: maxParticipants >= 8,
    },
    {
      position: 4,
      name: 'Hạng tư',
      eloPoints: Math.round(baseEloPoints[4] * multiplier),
      spaPoints: getSpaPoints(tier, 4),
      cashPrize: Math.round(totalPrize * distribution[4]),
      items: [],
      isVisible: maxParticipants >= 16,
    },
  ];
  
  return {
    totalPrize,
    showPrizes: entryFee > 0,
    positions: positions.filter(p => p.isVisible),
    specialAwards: [],
  };
};

// Get SPA points based on tier and position
const getSpaPoints = (tier: TournamentTier, position: number): number => {
  const spaPointsMap = {
    [TournamentTier.K]: { 1: 900, 2: 700, 3: 500, 4: 350 },
    [TournamentTier.I]: { 1: 1000, 2: 800, 3: 600, 4: 400 },
    [TournamentTier.H]: { 1: 1200, 2: 950, 3: 700, 4: 450 },
    [TournamentTier.G]: { 1: 1500, 2: 1200, 3: 900, 4: 600 },
  };
  
  return spaPointsMap[tier]?.[position as keyof typeof spaPointsMap[TournamentTier]] || 0;
};

// Basic validation function
const validateTournamentData = (data: Partial<TournamentFormData>): TournamentValidationErrors => {
  const errors: TournamentValidationErrors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Tên giải đấu là bắt buộc';
  }
  
  if (!data.venue_address?.trim()) {
    errors.venue_address = 'Địa điểm tổ chức là bắt buộc';
  }
  
  if (data.tournament_start && data.tournament_end) {
    if (new Date(data.tournament_end) <= new Date(data.tournament_start)) {
      errors.tournament_end = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
  }
  
  if (data.registration_end && data.tournament_start) {
    if (new Date(data.registration_end) > new Date(data.tournament_start)) {
      errors.registration_end = 'Thời gian đóng đăng ký phải trước khi giải đấu bắt đầu';
    }
  }
  
  if (!data.allow_all_ranks && (!data.eligible_ranks || data.eligible_ranks.length === 0)) {
    errors.eligible_ranks = 'Vui lòng chọn ít nhất một hạng hoặc cho phép tất cả hạng';
  }
  
  return errors;
};

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<TournamentFormData | null>(getDefaultTournamentData());
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<TournamentValidationErrors>({});
  const [draft, setDraft] = useState<TournamentDraft | null>(null);
  const [recalculateOnChange, setRecalculateOnChange] = useState(true);
  
  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);
  
  // Auto-save draft when tournament changes
  useEffect(() => {
    if (tournament) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 1000); // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [tournament]);
  
  const saveDraft = useCallback(() => {
    if (!tournament) return;
    
    const newDraft: TournamentDraft = {
      ...tournament,
      lastModified: new Date().toISOString(),
      isValid: Object.keys(validateTournamentData(tournament)).length === 0,
      step: currentStep,
    };
    
    setDraft(newDraft);
    localStorage.setItem('tournament-draft', JSON.stringify(newDraft));
  }, [tournament, currentStep]);
  
  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem('tournament-draft');
      if (savedDraft) {
        const parsedDraft: TournamentDraft = JSON.parse(savedDraft);
        setDraft(parsedDraft);
        
        // Load draft data into tournament state
        const { lastModified, isValid, step, ...draftData } = parsedDraft;
        setTournament({ ...getDefaultTournamentData(), ...draftData });
        setCurrentStep(step || 0);
        
        toast.success('Đã tải bản nháp từ lần trước');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);
  
  const clearDraft = useCallback(() => {
    localStorage.removeItem('tournament-draft');
    setDraft(null);
    setTournament(getDefaultTournamentData());
    setCurrentStep(0);
    setValidationErrors({});
    toast.success('Đã xóa bản nháp');
  }, []);
  
  const updateTournament = useCallback((data: Partial<TournamentFormData>) => {
    setTournament(prev => {
      if (!prev) return getDefaultTournamentData();
      
      const updated = { ...prev, ...data };
      
      // Auto-calculate rewards if relevant fields changed and auto-calc is enabled
      if (recalculateOnChange && (
        data.tier_level !== undefined ||
        data.entry_fee !== undefined ||
        data.max_participants !== undefined ||
        data.game_format !== undefined
      )) {
        updated.rewards = calculateTournamentRewards(
          updated.tier_level,
          updated.entry_fee,
          updated.max_participants,
          updated.game_format
        );
      }
      
      // Validate updated data
      const errors = validateTournamentData(updated);
      setValidationErrors(errors);
      
      return updated;
    });
  }, [recalculateOnChange]);
  
  const updateRewards = useCallback((rewards: TournamentRewards) => {
    setTournament(prev => {
      if (!prev) return null;
      return { ...prev, rewards };
    });
  }, []);
  
  const calculateRewards = useCallback((): TournamentRewards => {
    if (!tournament) {
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [],
        specialAwards: [],
      };
    }
    
    return calculateTournamentRewards(
      tournament.tier_level,
      tournament.entry_fee,
      tournament.max_participants,
      tournament.game_format
    );
  }, [tournament]);
  
  const validateTournament = useCallback((): boolean => {
    if (!tournament) return false;
    
    const errors = validateTournamentData(tournament);
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  }, [tournament]);
  
  const resetTournament = useCallback(() => {
    setTournament(getDefaultTournamentData());
    setCurrentStep(0);
    setValidationErrors({});
    clearDraft();
  }, [clearDraft]);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);
  
  const createTournament = useCallback(async (): Promise<EnhancedTournament | null> => {
    if (!tournament || !validateTournament()) {
      toast.error('Vui lòng kiểm tra lại thông tin giải đấu');
      return null;
    }
    
    try {
      // TODO: Implement actual API call to create tournament
      // For now, return a mock response
      const mockResponse: EnhancedTournament = {
        id: `tournament-${Date.now()}`,
        ...tournament,
        current_participants: 0,
        status: tournament.is_public ? 'open' : 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        available_slots: tournament.max_participants,
        registration_status: 'not_started',
        rewards: tournament.rewards || calculateRewards(),
      } as EnhancedTournament;
      
      toast.success('Tạo giải đấu thành công!');
      clearDraft();
      
      return mockResponse;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast.error('Có lỗi xảy ra khi tạo giải đấu');
      return null;
    }
  }, [tournament, validateTournament, calculateRewards, clearDraft]);
  
  const updateExistingTournament = useCallback(async (id: string): Promise<EnhancedTournament | null> => {
    if (!tournament || !validateTournament()) {
      toast.error('Vui lòng kiểm tra lại thông tin giải đấu');
      return null;
    }
    
    try {
      // TODO: Implement actual API call to update tournament
      toast.success('Cập nhật giải đấu thành công!');
      return null;
    } catch (error) {
      console.error('Failed to update tournament:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giải đấu');
      return null;
    }
  }, [tournament, validateTournament]);
  
  const value: TournamentContextType = {
    tournament,
    isDraft: !!draft,
    isValid: Object.keys(validationErrors).length === 0,
    currentStep,
    validationErrors,
    
    draft,
    saveDraft,
    loadDraft,
    clearDraft,
    
    updateTournament,
    updateRewards,
    validateTournament,
    resetTournament,
    
    setCurrentStep,
    nextStep,
    prevStep,
    
    calculateRewards,
    recalculateOnChange,
    setRecalculateOnChange,
    
    createTournament,
    updateExistingTournament,
  };
  
  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

export default TournamentProvider;