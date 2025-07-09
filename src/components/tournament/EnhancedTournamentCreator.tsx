import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  tournamentSchema, 
  TournamentFormData, 
  getDefaultTournamentData,
  PARTICIPANT_SLOTS,
  TOURNAMENT_FORMATS,
  GAME_FORMATS
} from '@/schemas/tournamentSchema';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';
import { TournamentSPAPreview } from '@/components/TournamentSPAPreview';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { useAdminCheck } from '@/hooks/useAdminCheck';

import { BasicInfoStep } from './steps/BasicInfoStep';
import { TournamentSettingsStep } from './steps/TournamentSettingsStep';
import { RegistrationSettingsStep } from './steps/RegistrationSettingsStep';
import { PreviewStep } from './steps/PreviewStep';

interface EnhancedTournamentCreatorProps {
  onSuccess?: (tournament: any) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', icon: Info },
  { id: 2, title: 'Cài đặt giải đấu', icon: Settings },
  { id: 3, title: 'Đăng ký tham gia', icon: Users },
  { id: 4, title: 'Xem trước & Xác nhận', icon: CheckCircle },
];

export const EnhancedTournamentCreator: React.FC<EnhancedTournamentCreatorProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { createTournament } = useTournaments();
  const { getTierByLevel } = useTournamentTiers();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: getDefaultTournamentData(),
    mode: 'onChange'
  });

  const { watch, trigger, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Permission check
  const canCreateTournament = isAdmin || user?.role === 'club_owner';

  if (!canCreateTournament) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
          <h3 className="text-lg font-semibold mb-2">Không có quyền truy cập</h3>
          <p className="text-muted-foreground mb-4">
            Chỉ quản trị viên và chủ câu lạc bộ mới có thể tạo giải đấu.
          </p>
          <Button onClick={onCancel} variant="outline">
            Quay lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  const calculatePrizeDistribution = (totalPrize: number) => {
    return {
      first: Math.floor(totalPrize * 0.5),
      second: Math.floor(totalPrize * 0.3),
      third: Math.floor(totalPrize * 0.2),
    };
  };

  const getCurrentStepValidation = async () => {
    switch (currentStep) {
      case 1:
        return await trigger(['name', 'description', 'tier_level', 'tournament_start', 'tournament_end', 'venue_address']);
      case 2:
        return await trigger(['max_participants', 'tournament_type', 'game_format', 'entry_fee', 'prize_pool']);
      case 3:
        return await trigger(['registration_start', 'registration_end']);
      default:
        return true;
    }
  };

  const handleNextStep = async () => {
    const isStepValid = await getCurrentStepValidation();
    if (isStepValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: TournamentFormData) => {
    try {
      setIsSubmitting(true);
      
      // Calculate prize distribution
      const prizeDistribution = calculatePrizeDistribution(data.prize_pool);
      
      // Create tournament data
      const tournamentData = {
        name: data.name,
        description: data.description,
        tournament_type: data.tournament_type,
        game_format: data.game_format,
        max_participants: data.max_participants,
        tournament_start: data.tournament_start,
        tournament_end: data.tournament_end,
        registration_start: data.registration_start,
        registration_end: data.registration_end,
        entry_fee: data.entry_fee,
        prize_pool: data.prize_pool,
        venue_name: data.venue_address,
        venue_address: data.venue_address,
        rules: data.rules || '',
      };

      const newTournament = await createTournament(tournamentData);
      
      const selectedTier = getTierByLevel(data.tier_level);
      toast.success(
        <div>
          <p className="font-semibold">🏆 Giải đấu đã được tạo thành công!</p>
          <p className="text-sm text-muted-foreground">
            {data.name} - {selectedTier?.tier_name || `Tier ${data.tier_level}`}
          </p>
        </div>
      );
      
      onSuccess?.(newTournament);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Có lỗi xảy ra khi tạo giải đấu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={form} />;
      case 2:
        return <TournamentSettingsStep form={form} />;
      case 3:
        return <RegistrationSettingsStep form={form} />;
      case 4:
        return <PreviewStep form={form} onSubmit={form.handleSubmit(onSubmit)} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Tạo giải đấu mới
          </CardTitle>
          
          {/* Progress */}
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between items-center">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${isActive 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-muted bg-background text-muted-foreground'
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.title}
                      </p>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`
                        hidden sm:block w-16 h-0.5 mx-4 
                        ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {STEPS[currentStep - 1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Tham gia:</span>
                </div>
                <span className="font-medium">{watchedData.max_participants || 0} người</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Phí đăng ký:</span>
                </div>
                <span className="font-medium">
                  {(watchedData.entry_fee || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>Giải thưởng:</span>
                </div>
                <span className="font-medium">
                  {(watchedData.prize_pool || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Vui lòng kiểm tra lại:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{error?.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="flex justify-between items-center p-4">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevStep}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Hủy bỏ' : 'Quay lại'}
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button 
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting || !isValid}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isSubmitting ? 'Đang tạo...' : '🏆 Tạo giải đấu'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTournamentCreator;