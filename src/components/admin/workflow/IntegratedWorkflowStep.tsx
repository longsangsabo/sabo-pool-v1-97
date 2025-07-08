import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface IntegratedWorkflowStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  onComplete?: (results: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canNext?: boolean;
  canPrevious?: boolean;
  autoAdvance?: boolean;
  sharedData?: any;
  isCompleted?: boolean;
  completionTime?: string;
}

export const IntegratedWorkflowStep: React.FC<IntegratedWorkflowStepProps> = ({
  stepNumber,
  title,
  description,
  icon,
  children,
  onNext,
  onPrevious,
  canNext = true,
  canPrevious = true,
  autoAdvance = false,
  isCompleted = false,
  completionTime
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <CardTitle className="text-xl">
                Bước {stepNumber}: {title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {description}
              </CardDescription>
            </div>
          </div>
          
          {isCompleted && (
            <div className="text-right">
              <div className="text-green-600 font-medium text-sm">✅ Đã Hoàn Thành</div>
              {completionTime && (
                <div className="text-xs text-gray-500">{completionTime}</div>
              )}
            </div>
          )}
          
          {autoAdvance && !isCompleted && (
            <div className="text-right">
              <div className="text-blue-600 font-medium text-sm">🤖 Tự Động Chuyển</div>
              <div className="text-xs text-gray-500">Sẽ tự động chuyển bước</div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {children}
        
        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button 
            onClick={onPrevious}
            disabled={!canPrevious}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Bước Trước
          </Button>
          
          <div className="flex gap-2">
            {isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Đặt Lại Bước
              </Button>
            )}
            
            <Button 
              onClick={onNext}
              disabled={!canNext}
              className="flex items-center gap-2"
            >
              Bước Tiếp
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};