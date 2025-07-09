import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { tournamentSchema } from '@/schemas/tournamentSchema';
import { TournamentFormData } from '@/types/tournament-extended';
import { useTournament } from '@/contexts/TournamentContext';
import { ValidationService } from '@/services/ValidationService';
import { BasicInfoSection } from './simplified-steps/BasicInfoSection';
import { TournamentSettingsSection } from './TournamentSettingsSection';
import { AdvancedSettingsSection } from './simplified-steps/AdvancedSettingsSection';
import { TournamentRewardsTable } from './TournamentRewardsTable';
import { RewardsEditModal } from './RewardsEditModal';
import { toast } from 'sonner';

interface EnhancedTournamentFormProps {
  mode?: 'create' | 'edit';
  tournamentId?: string;
  onSubmit?: (data: TournamentFormData) => void;
  onSuccess?: (tournament: any) => void;
  onCancel?: () => void;
}

export const EnhancedTournamentForm: React.FC<EnhancedTournamentFormProps> = ({
  mode = 'create',
  tournamentId,
  onSubmit,
  onSuccess,
  onCancel,
}) => {
  const {
    tournament,
    updateTournament,
    updateRewards,
    validateTournament,
    resetTournament,
    saveDraft,
    isDraft,
    isValid,
    validationErrors,
    calculateRewards,
    recalculateOnChange,
    setRecalculateOnChange,
    createTournament,
    updateExistingTournament,
  } = useTournament();

  const [currentStep, setCurrentStep] = useState(0);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['basic-info']);

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: tournament || undefined,
    mode: 'onChange',
  });

  const { formState: { errors: formErrors, isSubmitting: formSubmitting } } = form;

  // Sync form with context
  useEffect(() => {
    if (tournament) {
      form.reset(tournament);
    }
  }, [tournament, form]);

  // Auto-save draft
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (data && Object.keys(data).length > 0) {
        updateTournament(data as Partial<TournamentFormData>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateTournament]);

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    if (!tournament) return 0;
    
    const requiredFields = [
      'name', 'venue_address', 'tournament_start', 'tournament_end',
      'max_participants', 'tournament_type', 'game_format', 'tier_level'
    ];
    
    const completedFields = requiredFields.filter(field => 
      tournament[field as keyof TournamentFormData]
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Handle form submission
  const handleSubmit = async (data: TournamentFormData) => {
    setIsSubmitting(true);
    
    try {
      if (!validateTournament()) {
        toast.error('Vui lòng kiểm tra lại thông tin giải đấu');
        return;
      }

      let result;
      if (mode === 'edit' && tournamentId) {
        result = await updateExistingTournament(tournamentId);
      } else {
        result = await createTournament();
      }

      if (result) {
        onSubmit?.(data);
        onSuccess?.(result);
        toast.success(mode === 'edit' ? 'Cập nhật giải đấu thành công!' : 'Tạo giải đấu thành công!');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Có lỗi xảy ra khi xử lý');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle section expansion
  const handleSectionChange = (value: string[]) => {
    setExpandedSections(value);
  };

  // Validation summary
  const getValidationSummary = () => {
    const validation = ValidationService.validateTournamentData(tournament || {});
    return validation;
  };

  const validationSummary = getValidationSummary();
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {mode === 'edit' ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}
          </h3>
          <div className="flex items-center gap-2">
            {isDraft && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                <Save className="w-3 h-3 mr-1" />
                Đã lưu nháp
              </Badge>
            )}
            <Badge variant={isValid ? 'default' : 'destructive'}>
              {isValid ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {isValid ? 'Hợp lệ' : 'Cần kiểm tra'}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ hoàn thành</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Validation Alerts */}
      {validationSummary.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationSummary.warnings.map((warning, index) => (
                <div key={index} className="text-sm">• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!validationSummary.isValid && Object.keys(validationSummary.errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {Object.entries(validationSummary.errors).map(([field, error]) => (
                <div key={field} className="text-sm">
                  • {Array.isArray(error) ? error.join(', ') : error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Accordion 
          type="multiple" 
          value={expandedSections} 
          onValueChange={handleSectionChange}
          className="space-y-4"
        >
          {/* Basic Information */}
          <AccordionItem value="basic-info" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Thông tin cơ bản</span>
                  {tournament?.name && tournament?.venue_address && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <BasicInfoSection form={form} />
            </AccordionContent>
          </AccordionItem>

          {/* Tournament Settings */}
          <AccordionItem value="tournament-settings" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Cài đặt giải đấu</span>
                  {tournament?.max_participants && tournament?.tournament_type && tournament?.game_format && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <TournamentSettingsSection form={form} />
            </AccordionContent>
          </AccordionItem>

          {/* Rewards */}
          <AccordionItem value="rewards" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Phần thưởng</span>
                  <Badge variant="outline" className="text-xs">
                    Tự động tính
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tự động tính toán phần thưởng</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRecalculateOnChange(!recalculateOnChange)}
                  >
                    {recalculateOnChange ? 'Tắt tự động' : 'Bật tự động'}
                  </Button>
                </div>
                
                <TournamentRewardsTable 
                  rewards={tournament?.rewards || calculateRewards()}
                  onEdit={() => setShowRewardsModal(true)}
                  isEditable={true}
                  entryFee={tournament?.entry_fee || 0}
                  maxParticipants={tournament?.max_participants || 0}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Settings */}
          <AccordionItem value="advanced-settings" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Cài đặt nâng cao</span>
                  {tournament?.registration_start && tournament?.registration_end && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <AdvancedSettingsSection form={form} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                saveDraft();
                toast.success('Đã lưu nháp');
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu nháp
            </Button>
            
            {isDraft && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetTournament();
                  toast.success('Đã đặt lại form');
                }}
              >
                Đặt lại
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Hủy bỏ
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || formSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting || formSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                mode === 'edit' ? 'Cập nhật' : 'Tạo giải đấu'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Rewards Edit Modal */}
      {showRewardsModal && tournament && (
        <RewardsEditModal
          rewards={tournament.rewards || calculateRewards()}
          tournamentData={{
            tier_level: tournament.tier_level,
            entry_fee: tournament.entry_fee,
            max_participants: tournament.max_participants,
            game_format: tournament.game_format,
          }}
          onSave={(rewards) => {
            updateRewards(rewards);
            setShowRewardsModal(false);
            toast.success('Đã cập nhật phần thưởng');
          }}
          onCancel={() => setShowRewardsModal(false)}
        />
      )}
    </div>
  );
};