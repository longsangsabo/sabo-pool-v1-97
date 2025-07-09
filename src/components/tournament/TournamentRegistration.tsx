import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  User,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import {
  tournamentRegistrationSchema,
  TournamentRegistrationFormData,
  getDefaultRegistrationData,
  REGISTRATION_RANKS,
  PAYMENT_METHODS,
  EXPERIENCE_LEVELS
} from '@/schemas/tournamentRegistrationSchema';

import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { supabase } from '@/integrations/supabase/client';

// Step components
import { TournamentSelectionStep } from './registration-steps/TournamentSelectionStep';
import { PersonalInfoStep } from './registration-steps/PersonalInfoStep';
import { PaymentStep } from './registration-steps/PaymentStep';
import { ConfirmationStep } from './registration-steps/ConfirmationStep';

interface TournamentRegistrationProps {
  preSelectedTournamentId?: string;
  onSuccess?: (registration: any) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Chọn giải đấu', icon: Trophy },
  { id: 2, title: 'Thông tin cá nhân', icon: User },
  { id: 3, title: 'Thanh toán', icon: CreditCard },
  { id: 4, title: 'Xác nhận', icon: CheckCircle },
];

export const TournamentRegistration: React.FC<TournamentRegistrationProps> = ({
  preSelectedTournamentId,
  onSuccess,
  onCancel
}) => {
  const { user, profile } = useAuth();
  const { tournaments, loading: tournamentsLoading, registerForTournament } = useTournaments();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const form = useForm<TournamentRegistrationFormData>({
    resolver: zodResolver(tournamentRegistrationSchema),
    defaultValues: getDefaultRegistrationData(),
    mode: 'onChange'
  });

  const { watch, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Pre-select tournament if provided
  useEffect(() => {
    if (preSelectedTournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === preSelectedTournamentId);
      if (tournament) {
        setSelectedTournament(tournament);
        form.setValue('tournament_id', preSelectedTournamentId);
      }
    }
  }, [preSelectedTournamentId, tournaments, form]);

  // Auto-fill user data
  useEffect(() => {
    if (profile) {
      form.setValue('player_name', profile.full_name || '');
      form.setValue('phone', profile.phone || '');
      form.setValue('email', profile.email || '');
    }
  }, [profile, form]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!watchedData.tournament_id && !!selectedTournament;
      case 2:
        return !!(
          watchedData.player_name &&
          watchedData.phone &&
          watchedData.current_rank &&
          watchedData.age &&
          watchedData.agree_terms &&
          watchedData.agree_rules
        );
      case 3:
        return !!watchedData.payment_method;
      case 4:
        return isValid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Vui lòng hoàn thiện thông tin trước khi tiếp tục');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const checkRegistrationEligibility = (): { eligible: boolean; reason?: string } => {
    if (!selectedTournament || !user) {
      return { eligible: false, reason: 'Không tìm thấy thông tin giải đấu hoặc người dùng' };
    }

    // Check registration period
    const now = new Date();
    const regStart = new Date(selectedTournament.registration_start);
    const regEnd = new Date(selectedTournament.registration_end);
    
    if (now < regStart) {
      return { eligible: false, reason: 'Chưa đến thời gian đăng ký' };
    }
    
    if (now > regEnd) {
      return { eligible: false, reason: 'Đã hết hạn đăng ký' };
    }

    // Check rank requirements
    const userRank = watchedData.current_rank;
    if (selectedTournament.min_rank_requirement && userRank) {
      const minRank = REGISTRATION_RANKS.find(r => r.value === selectedTournament.min_rank_requirement);
      const currentRank = REGISTRATION_RANKS.find(r => r.value === userRank);
      
      if (minRank && currentRank) {
        const minIndex = REGISTRATION_RANKS.indexOf(minRank);
        const currentIndex = REGISTRATION_RANKS.indexOf(currentRank);
        
        if (currentIndex < minIndex) {
          return { eligible: false, reason: `Yêu cầu tối thiểu hạng ${selectedTournament.min_rank_requirement}` };
        }
      }
    }

    if (selectedTournament.max_rank_requirement && userRank) {
      const maxRank = REGISTRATION_RANKS.find(r => r.value === selectedTournament.max_rank_requirement);
      const currentRank = REGISTRATION_RANKS.find(r => r.value === userRank);
      
      if (maxRank && currentRank) {
        const maxIndex = REGISTRATION_RANKS.indexOf(maxRank);
        const currentIndex = REGISTRATION_RANKS.indexOf(currentRank);
        
        if (currentIndex > maxIndex) {
          return { eligible: false, reason: `Vượt quá hạng tối đa ${selectedTournament.max_rank_requirement}` };
        }
      }
    }

    // Check available slots
    if (selectedTournament.current_participants >= selectedTournament.max_participants) {
      return { eligible: false, reason: 'Giải đấu đã đủ số lượng tham gia' };
    }

    // Check age requirement
    if (watchedData.age < 16) {
      return { eligible: false, reason: 'Phải từ 16 tuổi trở lên để tham gia' };
    }

    return { eligible: true };
  };

  const createPaymentOrder = async (): Promise<string | null> => {
    if (!selectedTournament) return null;

    try {
      const orderId = `TOURNAMENT_${selectedTournament.id}_${user?.id}_${Date.now()}`;
      const amount = selectedTournament.entry_fee;
      const orderInfo = `Đăng ký giải đấu: ${selectedTournament.name}`;

      // This would call your VNPAY integration
      const response = await fetch('/api/payments/create-vnpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          orderInfo,
          orderType: 'tournament_registration'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.paymentUrl;
      } else {
        throw new Error(data.message || 'Không thể tạo đơn thanh toán');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      toast.error('Lỗi tạo thanh toán: ' + (error as Error).message);
      return null;
    }
  };

  const handleSubmitRegistration = async (data: TournamentRegistrationFormData) => {
    if (!user || !selectedTournament) return;

    const eligibility = checkRegistrationEligibility();
    if (!eligibility.eligible) {
      toast.error(eligibility.reason || 'Không đủ điều kiện đăng ký');
      return;
    }

    setRegistrationLoading(true);

    try {
      // Create registration record
      const { data: registration, error: regError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: data.tournament_id,
          player_id: user.id,
          registration_status: data.payment_method === 'cash' ? 'pending_payment' : 'pending',
          payment_status: data.payment_method === 'cash' ? 'pending' : 'unpaid',
          notes: data.notes,
          registration_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (regError) throw regError;

      // Handle payment based on method
      if (data.payment_method === 'vnpay') {
        const paymentUrl = await createPaymentOrder();
        if (paymentUrl) {
          // Store payment URL and show in confirmation step
          setPaymentUrl(paymentUrl);
          toast.success('Đăng ký thành công! Vui lòng thanh toán để hoàn tất.');
        } else {
          throw new Error('Không thể tạo liên kết thanh toán');
        }
      } else {
        toast.success('Đăng ký thành công! Vui lòng thanh toán theo hướng dẫn.');
      }

      // Move to confirmation step
      setCurrentStep(4);

      if (onSuccess) {
        onSuccess(registration);
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Lỗi đăng ký: ' + (error as Error).message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleSubmit = form.handleSubmit(handleSubmitRegistration);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TournamentSelectionStep
            form={form}
            tournaments={tournaments}
            loading={tournamentsLoading}
            selectedTournament={selectedTournament}
            onTournamentSelect={setSelectedTournament}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            form={form}
            selectedTournament={selectedTournament}
          />
        );
      case 3:
        return (
          <PaymentStep
            form={form}
            selectedTournament={selectedTournament}
          />
        );
      case 4:
        return (
          <ConfirmationStep
            form={form}
            selectedTournament={selectedTournament}
            paymentUrl={paymentUrl}
            onComplete={() => onSuccess?.({})}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Đăng ký tham gia giải đấu
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <currentStepData.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{currentStepData.title}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Bước {currentStep} / {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Steps indicator */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = currentStep >= step.id;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && setCurrentStep(step.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : isCompleted
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'text-muted-foreground hover:text-foreground'
              } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <div className={`p-2 rounded-full ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-muted'
              }`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-center">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              disabled={registrationLoading}
            >
              {currentStep === 1 ? 'Hủy' : 'Quay lại'}
            </Button>
            
            <div className="flex gap-2">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep) || registrationLoading}
                >
                  Tiếp tục
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || registrationLoading}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  {registrationLoading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament info sidebar (if tournament selected) */}
      {selectedTournament && currentStep > 1 && (
        <Card className="fixed top-4 right-4 w-80 shadow-lg z-50 hidden lg:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {selectedTournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(selectedTournament.tournament_start).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{selectedTournament.venue_address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{selectedTournament.current_participants}/{selectedTournament.max_participants} thí sinh</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedTournament.entry_fee?.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Separator />
            <Badge variant="secondary">
              Level {selectedTournament.tier_level || 1}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};