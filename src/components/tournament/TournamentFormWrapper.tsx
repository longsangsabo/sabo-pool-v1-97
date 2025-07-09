import React, { Suspense } from 'react';
import { TournamentProvider } from '@/contexts/TournamentContext';
import ErrorBoundary from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EnhancedTournamentForm } from './EnhancedTournamentForm';

interface TournamentFormWrapperProps {
  onSuccess?: (tournament: any) => void;
  onCancel?: () => void;
}

export const TournamentFormWrapper: React.FC<TournamentFormWrapperProps> = ({
  onSuccess,
  onCancel
}) => {
  return (
    <ErrorBoundary>
      <TournamentProvider>
        <Suspense fallback={<LoadingSpinner size="lg" text="Đang tải form tạo giải đấu..." />}>
          <EnhancedTournamentForm 
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Suspense>
      </TournamentProvider>
    </ErrorBoundary>
  );
};

export default TournamentFormWrapper;