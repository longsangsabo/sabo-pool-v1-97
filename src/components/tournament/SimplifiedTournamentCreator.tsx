import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Trophy, 
  Users, 
  DollarSign,
  MapPin,
  Calendar,
  Settings,
  Info,
  CheckCircle,
  Clock,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

import { ProfileProvider } from '@/contexts/ProfileContext';
import { AutoFillButton } from '@/components/common/AutoFillButton';
import { useAutoFillForm } from '@/hooks/useAutoFillForm';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentTiers } from '@/hooks/useTournamentTiers';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';

import { BasicInfoSection } from './simplified-steps/BasicInfoSection';
import { TournamentSettingsSection } from './simplified-steps/TournamentSettingsSection';
import { AdvancedSettingsSection } from './simplified-steps/AdvancedSettingsSection';
import { SimplifiedTournamentPreview } from './SimplifiedTournamentPreview';
import { TournamentTemplateSelector } from './TournamentTemplateSelector';
import { ConfirmationModal } from './ConfirmationModal';
import { PrizeManagementModal, type PrizeStructure } from './PrizeManagementModal';

// Simplified schema - only essential fields required
const simplifiedTournamentSchema = z.object({
  // Essential fields
  name: z.string().min(3, 'Tên giải đấu phải có ít nhất 3 ký tự'),
  tier_level: z.number().min(1, 'Vui lòng chọn hạng giải'),
  tournament_start: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  tournament_end: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
  venue_address: z.string().min(5, 'Địa điểm phải có ít nhất 5 ký tự'),
  entry_fee: z.number().min(0, 'Phí tham gia không được âm'),
  max_participants: z.number().min(4, 'Tối thiểu 4 người tham gia'),
  
  // Optional fields with defaults
  description: z.string().default(''),
  tournament_type: z.string().default('single_elimination'),
  game_format: z.string().default('8_ball'),
  prize_pool: z.number().default(0),
  registration_start: z.string().optional(),
  registration_end: z.string().optional(),
  rules: z.string().default(''),
  contact_info: z.string().default(''),
  is_public: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
});

type SimplifiedTournamentFormData = z.infer<typeof simplifiedTournamentSchema>;

// Tournament templates
const TOURNAMENT_TEMPLATES = [
  {
    id: 'standard',
    name: 'Giải Standard',
    description: '16 người, Single Elimination',
    icon: Trophy,
    data: {
      max_participants: 16,
      tournament_type: 'single_elimination',
      game_format: '8_ball',
      entry_fee: 50000,
      prize_pool: 600000,
    }
  },
  {
    id: 'mini',
    name: 'Giải Mini',
    description: '8 người, Single Elimination',
    icon: Users,
    data: {
      max_participants: 8,
      tournament_type: 'single_elimination',
      game_format: '9_ball',
      entry_fee: 30000,
      prize_pool: 200000,
    }
  },
  {
    id: 'double',
    name: 'Giải Double',
    description: '16 người, Double Elimination',
    icon: Target,
    data: {
      max_participants: 16,
      tournament_type: 'double_elimination',
      game_format: '8_ball',
      entry_fee: 75000,
      prize_pool: 900000,
    }
  },
  {
    id: 'club',
    name: 'Giải Club',
    description: '32 người, Group + Knockout',
    icon: Settings,
    data: {
      max_participants: 32,
      tournament_type: 'single_elimination',
      game_format: '10_ball',
      entry_fee: 100000,
      prize_pool: 2400000,
    }
  }
];

interface SimplifiedTournamentCreatorProps {
  onSuccess?: (tournament: any) => void;
  onCancel?: () => void;
}

const SimplifiedTournamentCreatorContent: React.FC<SimplifiedTournamentCreatorProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { createTournament } = useTournaments();
  const { getTierByLevel } = useTournamentTiers();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeStructure, setPrizeStructure] = useState<PrizeStructure | undefined>(undefined);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<SimplifiedTournamentFormData>({
    resolver: zodResolver(simplifiedTournamentSchema),
    defaultValues: {
      name: '',
      description: '',
      tier_level: 1,
      tournament_start: '',
      tournament_end: '',
      venue_address: '',
      entry_fee: 0,
      max_participants: 16,
      tournament_type: 'single_elimination',
      game_format: '8_ball',
      prize_pool: 0,
      is_public: true,
      requires_approval: false,
      rules: '',
      contact_info: '',
    },
    mode: 'onChange'
  });

  // Auto-fill functionality
  const { fillClubInfo, hasClubProfile } = useAutoFillForm(form, {
    clubFields: ['venue_address', 'contact_info']
  });

  const { watch, setValue, formState: { errors, isValid, isDirty } } = form;
  const watchedData = watch();

  // Add debugging
  console.log('Form state:', {
    errors,
    isValid,
    isDirty,
    watchedData: {
      name: watchedData.name,
      venue_address: watchedData.venue_address,
      tier_level: watchedData.tier_level,
      tournament_start: watchedData.tournament_start,
      tournament_end: watchedData.tournament_end,
      entry_fee: watchedData.entry_fee,
      max_participants: watchedData.max_participants
    }
  });

  // Permission check
  const canCreateTournament = isAdmin || user?.role === 'club_owner';

  if (!canCreateTournament) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-warning" />
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

  // Calculate progress based on filled essential fields
  const calculateProgress = () => {
    const essentialFields = ['name', 'tier_level', 'tournament_start', 'tournament_end', 'venue_address', 'entry_fee', 'max_participants'];
    const filledFields = essentialFields.filter(field => {
      const value = watchedData[field as keyof SimplifiedTournamentFormData];
      // For tier_level, entry_fee, max_participants, check if they're > 0
      if (field === 'tier_level' || field === 'entry_fee' || field === 'max_participants') {
        return value !== null && value !== undefined && typeof value === 'number' && value > 0;
      }
      // For strings, check if they're not empty
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
    
    console.log('Progress calculation:', {
      essentialFields,
      filledFields: filledFields.map(field => ({
        field,
        value: watchedData[field as keyof SimplifiedTournamentFormData]
      })),
      progress: Math.round((filledFields.length / essentialFields.length) * 100)
    });
    
    return Math.round((filledFields.length / essentialFields.length) * 100);
  };

  // Auto-calculate tournament end time based on participants
  const calculateEstimatedEndTime = (startTime: string, participants: number) => {
    if (!startTime) return '';
    
    const start = new Date(startTime);
    // Estimate: 30 minutes per match, tournament structure
    const estimatedHours = Math.ceil(Math.log2(participants)) * 1.5;
    const end = new Date(start.getTime() + estimatedHours * 60 * 60 * 1000);
    
    return end.toISOString().slice(0, 16);
  };

  // Auto-calculate registration times
  const calculateRegistrationTimes = (startTime: string) => {
    if (!startTime) return { start: '', end: '' };
    
    const tournamentStart = new Date(startTime);
    const regStart = new Date(Date.now());
    const regEnd = new Date(tournamentStart.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    
    return {
      start: regStart.toISOString().slice(0, 16),
      end: regEnd.toISOString().slice(0, 16)
    };
  };

  // Apply tournament template
  const applyTemplate = (template: typeof TOURNAMENT_TEMPLATES[0]) => {
    Object.entries(template.data).forEach(([key, value]) => {
      setValue(key as keyof SimplifiedTournamentFormData, value as any);
    });
    
    toast.success(`Đã áp dụng template "${template.name}"`);
  };

  // Handle auto-calculations
  React.useEffect(() => {
    if (watchedData.tournament_start && watchedData.max_participants) {
      const estimated = calculateEstimatedEndTime(watchedData.tournament_start, watchedData.max_participants);
      if (estimated && !watchedData.tournament_end) {
        setValue('tournament_end', estimated);
      }
      
      const regTimes = calculateRegistrationTimes(watchedData.tournament_start);
      if (!watchedData.registration_start) setValue('registration_start', regTimes.start);
      if (!watchedData.registration_end) setValue('registration_end', regTimes.end);
    }
  }, [watchedData.tournament_start, watchedData.max_participants]);

  // Auto-calculate suggested prize pool
  React.useEffect(() => {
    if (watchedData.max_participants && watchedData.entry_fee && !watchedData.prize_pool) {
      const suggested = Math.floor(watchedData.max_participants * watchedData.entry_fee * 0.8);
      setValue('prize_pool', suggested);
    }
  }, [watchedData.max_participants, watchedData.entry_fee]);

  // Handle prize modal events
  React.useEffect(() => {
    const handleOpenPrizeModal = (event: CustomEvent) => {
      setShowPrizeModal(true);
    };
    
    window.addEventListener('openPrizeModal' as any, handleOpenPrizeModal);
    return () => window.removeEventListener('openPrizeModal' as any, handleOpenPrizeModal);
  }, []);

  const handlePrizeSave = (structure: PrizeStructure) => {
    setPrizeStructure(structure);
    setValue('prize_pool', structure.totalPrize);
  };

  const onSubmit = async (data: SimplifiedTournamentFormData) => {
    try {
      setIsSubmitting(true);
      
      const tournamentData = {
        name: data.name,
        description: data.description || `Giải đấu ${data.name}`,
        tournament_type: data.tournament_type as "single_elimination" | "double_elimination" | "round_robin" | "swiss",
        game_format: data.game_format as "8_ball" | "9_ball" | "10_ball" | "straight_pool",
        max_participants: data.max_participants,
        tournament_start: data.tournament_start,
        tournament_end: data.tournament_end,
        registration_start: data.registration_start || data.tournament_start,
        registration_end: data.registration_end || data.tournament_start,
        entry_fee: data.entry_fee,
        prize_pool: data.prize_pool,
        venue_name: data.venue_address,
        venue_address: data.venue_address,
        rules: data.rules || 'Áp dụng luật chung của giải đấu bida.',
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

  const handleConfirmSubmit = () => {
    setShowConfirmation(true);
  };

  const progress = calculateProgress();

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Tạo giải đấu mới</CardTitle>
                  <p className="text-sm text-muted-foreground">Tạo giải đấu nhanh chóng và dễ dàng</p>
                </div>
              </div>
              <AutoFillButton 
                formRef={formRef}
                type="club"
                size="sm"
                onClick={() => fillClubInfo()}
                disabled={!hasClubProfile}
              />
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tiến độ hoàn thành</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{progress}%</span>
                  {progress === 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              {progress < 100 && (
                <p className="text-xs text-muted-foreground">
                  Hoàn thành thông tin cơ bản để tạo giải đấu
                </p>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Templates */}
        <TournamentTemplateSelector 
          templates={TOURNAMENT_TEMPLATES}
          onSelectTemplate={applyTemplate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <Accordion type="multiple" defaultValue={["basic", "settings"]} className="space-y-4">
                {/* Basic Information */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>Thông tin cơ bản</span>
                      <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        <BasicInfoSection form={form} />
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Tournament Settings */}
                <AccordionItem value="settings">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Cài đặt giải đấu</span>
                      <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        <TournamentSettingsSection form={form} />
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Advanced Settings */}
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Cài đặt nâng cao</span>
                      <Badge variant="secondary" className="text-xs">Tùy chọn</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        <AdvancedSettingsSection form={form} />
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Validation Errors */}
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <Trophy className="h-4 w-4" />
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

              {/* Actions */}
              <Card>
                <CardContent className="flex justify-between items-center p-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Hủy bỏ
                  </Button>

                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button 
                           type="button"
                           onClick={handleConfirmSubmit}
                           disabled={isSubmitting || !isValid}
                           className="bg-gradient-to-r from-primary to-primary/80"
                         >
                          {isSubmitting ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <Trophy className="h-4 w-4 mr-2" />
                              Tạo giải đấu
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {progress < 100 ? 'Hoàn thành thông tin cơ bản trước' : 'Tạo giải đấu mới'}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Real-time Preview */}
          <div className="space-y-4">
            <SimplifiedTournamentPreview 
              data={watchedData}
              errors={errors}
            />
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          data={watchedData}
          onConfirm={() => {
            setShowConfirmation(false);
            form.handleSubmit(onSubmit)();
          }}
          isSubmitting={isSubmitting}
        />

        {/* Prize Management Modal */}
        <PrizeManagementModal
          isOpen={showPrizeModal}
          onClose={() => setShowPrizeModal(false)}
          onSave={handlePrizeSave}
          initialPrizes={prizeStructure}
          entryFee={watchedData.entry_fee || 0}
          maxParticipants={watchedData.max_participants || 16}
        />
      </div>
    </TooltipProvider>
  );
};

export const SimplifiedTournamentCreator: React.FC<SimplifiedTournamentCreatorProps> = (props) => {
  return (
    <ProfileProvider>
      <SimplifiedTournamentCreatorContent {...props} />
    </ProfileProvider>
  );
};

export default SimplifiedTournamentCreator;