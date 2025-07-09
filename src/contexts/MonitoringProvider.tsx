import React, { createContext, useContext, ReactNode } from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';

interface MonitoringContextType {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackTournamentView: (tournamentId: string, tournamentName: string) => void;
  trackTournamentRegistration: (tournamentId: string, tournamentName: string, entryFee: number) => void;
  trackChallengeCreated: (challengeType: string, stakeAmount?: number) => void;
  trackMatchResult: (matchId: string, isWinner: boolean, matchDuration: number) => void;
  trackPayment: (amount: number, paymentMethod: string, transactionType: string) => void;
  trackClubJoin: (clubId: string, clubName: string) => void;
  trackFeatureUsage: (featureName: string, context?: Record<string, any>) => void;
  trackSearchQuery: (query: string, resultCount: number, category?: string) => void;
  startTimer: (name: string) => () => void;
  addMetric: (name: string, value: number, metadata?: Record<string, any>) => void;
  trackAPICall: (endpoint: string, method: string, duration: number, status: number) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

interface MonitoringProviderProps {
  children: ReactNode;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children }) => {
  const monitoring = useMonitoring();

  return (
    <MonitoringContext.Provider value={monitoring}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoringContext = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoringContext must be used within a MonitoringProvider');
  }
  return context;
};