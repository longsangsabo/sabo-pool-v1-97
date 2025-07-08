import React from 'react';
import { Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  autoAdvance?: boolean;
  dependencies?: number[];
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: 'Chọn Giải Đấu & Xác Thực Bracket',
    description: 'Chọn giải đấu và xác thực cấu trúc bracket',
    icon: '🏆',
    autoAdvance: true,
    dependencies: []
  },
  {
    id: 2,
    title: 'Kiểm Tra Báo Cáo Trận Đấu',
    description: 'Test báo cáo kết quả trận đấu và logic advancement',
    icon: '⚾',
    autoAdvance: false,
    dependencies: [1]
  },
  {
    id: 3,
    title: 'Tiến Trình Giải Đấu',
    description: 'Test tiến trình giải đấu từ đầu đến cuối',
    icon: '🚀',
    autoAdvance: true,
    dependencies: [1, 2]
  },
  {
    id: 4,
    title: 'Điều Khiển Quản Trị',
    description: 'Test các chức năng quản trị viên',
    icon: '⚙️',
    autoAdvance: false,
    dependencies: [1]
  },
  {
    id: 5,
    title: 'Kiểm Tra Trải Nghiệm Người Dùng',
    description: 'Test trải nghiệm người dùng và UI/UX',
    icon: '👤',
    autoAdvance: false,
    dependencies: [1]
  },
  {
    id: 6,
    title: 'Kiểm Tra Hiệu Suất',
    description: 'Test hiệu suất với dữ liệu lớn',
    icon: '📊',
    autoAdvance: false,
    dependencies: [1, 2, 3]
  },
  {
    id: 7,
    title: 'Dọn Dẹp Dữ Liệu',
    description: 'Dọn dẹp dữ liệu test và hoàn tất workflow',
    icon: '🧹',
    autoAdvance: false,
    dependencies: [1, 2, 3, 4, 5, 6]
  }
];

interface WorkflowProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepId: number) => void;
  canProceedToStep: (stepId: number) => boolean;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  canProceedToStep
}) => {
  return (
    <div className="bg-white rounded-lg p-6 border mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">🏆 Quy Trình Kiểm Tra Giải Đấu</h2>
        <div className="text-sm text-gray-500">
          Bước {currentStep} / {WORKFLOW_STEPS.length} | {completedSteps.length} đã hoàn thành
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="flex space-x-2 mb-6">
        {WORKFLOW_STEPS.map(step => (
          <div 
            key={step.id}
            className={`flex-1 h-3 rounded-full transition-all duration-300 ${
              completedSteps.includes(step.id) 
                ? 'bg-green-500' 
                : currentStep === step.id 
                ? 'bg-blue-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {WORKFLOW_STEPS.map(step => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const canAccess = canProceedToStep(step.id);
          
          return (
            <Button
              key={step.id}
              variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
              className={`p-4 h-auto flex items-start gap-3 text-left ${
                !canAccess ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => canAccess && onStepClick(step.id)}
              disabled={!canAccess}
            >
              <div className="text-2xl">{step.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Bước {step.id}</span>
                  {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                  {!canAccess && <Lock className="h-4 w-4 text-gray-400" />}
                </div>
                <div className="font-semibold text-xs mb-1">{step.title}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{step.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};