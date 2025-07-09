import { useEffect } from 'react';
import { webVitalsTracker } from '@/lib/webVitalsTracker';
import { performanceMonitor } from '@/lib/performanceMonitor';
import { analyticsTracker } from '@/lib/analyticsTracker';
import { useAuth } from '@/hooks/useAuth';

export const useMonitoring = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Set user ID for all tracking services when user is available
    if (user?.id) {
      webVitalsTracker.setUserId(user.id);
      performanceMonitor.setUserId(user.id);
      analyticsTracker.setUserId(user.id);
    }
  }, [user?.id]);

  // Track page navigation
  useEffect(() => {
    analyticsTracker.trackEvent('page_view', {
      path: window.location.pathname,
      timestamp: Date.now()
    });
  }, []);

  // Track user session duration
  useEffect(() => {
    const sessionStart = Date.now();
    
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart;
      analyticsTracker.trackEvent('session_end', {
        duration: sessionDuration,
        path: window.location.pathname
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return {
    // Expose tracking methods for manual use
    trackEvent: analyticsTracker.trackEvent.bind(analyticsTracker),
    trackTournamentView: analyticsTracker.trackTournamentView.bind(analyticsTracker),
    trackTournamentRegistration: analyticsTracker.trackTournamentRegistration.bind(analyticsTracker),
    trackChallengeCreated: analyticsTracker.trackChallengeCreated.bind(analyticsTracker),
    trackMatchResult: analyticsTracker.trackMatchResult.bind(analyticsTracker),
    trackPayment: analyticsTracker.trackPayment.bind(analyticsTracker),
    trackClubJoin: analyticsTracker.trackClubJoin.bind(analyticsTracker),
    trackFeatureUsage: analyticsTracker.trackFeatureUsage.bind(analyticsTracker),
    trackSearchQuery: analyticsTracker.trackSearchQuery.bind(analyticsTracker),
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    addMetric: performanceMonitor.addMetric.bind(performanceMonitor),
    trackAPICall: performanceMonitor.trackAPICall.bind(performanceMonitor)
  };
};