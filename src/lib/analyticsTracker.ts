interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: number;
  sessionId: string;
  url: string;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    
    // Send events periodically
    setInterval(() => {
      this.flushEvents();
    }, 30000); // Every 30 seconds

    // Send events before page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    // Track page views
    this.trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });

    // Track route changes for SPAs
    let currentPath = window.location.pathname;
    const checkForRouteChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.trackEvent('page_view', {
          path: currentPath,
          referrer: document.referrer
        });
      }
    };

    setInterval(checkForRouteChange, 1000);

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button?.textContent?.trim() || 'Unknown';
        
        this.trackEvent('button_click', {
          button_text: buttonText,
          button_type: button?.getAttribute('type') || 'button',
          page: window.location.pathname
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = link?.getAttribute('href');
        
        if (href) {
          this.trackEvent('link_click', {
            href,
            text: link?.textContent?.trim() || 'Unknown',
            external: href.startsWith('http') && !href.includes(window.location.hostname)
          });
        }
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id || 'unknown';
      
      this.trackEvent('form_submit', {
        form_id: formId,
        form_action: form.action || window.location.href,
        form_method: form.method || 'GET'
      });
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_promise_rejection', {
        reason: event.reason?.toString() || 'Unknown',
        stack: event.reason?.stack
      });
    });
  }

  public trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      userId: this.userId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href
    };

    this.events.push(event);

    // Log for debugging
    console.log(`[Analytics] ${name}:`, event);

    // Send critical events immediately
    if (name.includes('error') || name.includes('payment') || name.includes('registration')) {
      this.sendEvent(event);
    }
  }

  // Predefined tracking methods for common events
  public trackTournamentView(tournamentId: string, tournamentName: string) {
    this.trackEvent('tournament_view', {
      tournament_id: tournamentId,
      tournament_name: tournamentName
    });
  }

  public trackTournamentRegistration(tournamentId: string, tournamentName: string, entryFee: number) {
    this.trackEvent('tournament_registration', {
      tournament_id: tournamentId,
      tournament_name: tournamentName,
      entry_fee: entryFee
    });
  }

  public trackChallengeCreated(challengeType: string, stakeAmount?: number) {
    this.trackEvent('challenge_created', {
      challenge_type: challengeType,
      stake_amount: stakeAmount || 0
    });
  }

  public trackMatchResult(matchId: string, isWinner: boolean, matchDuration: number) {
    this.trackEvent('match_completed', {
      match_id: matchId,
      is_winner: isWinner,
      match_duration: matchDuration
    });
  }

  public trackPayment(amount: number, paymentMethod: string, transactionType: string) {
    this.trackEvent('payment_completed', {
      amount,
      payment_method: paymentMethod,
      transaction_type: transactionType
    });
  }

  public trackClubJoin(clubId: string, clubName: string) {
    this.trackEvent('club_joined', {
      club_id: clubId,
      club_name: clubName
    });
  }

  public trackFeatureUsage(featureName: string, context?: Record<string, any>) {
    this.trackEvent('feature_used', {
      feature_name: featureName,
      ...context
    });
  }

  public trackSearchQuery(query: string, resultCount: number, category?: string) {
    this.trackEvent('search_performed', {
      query,
      result_count: resultCount,
      category
    });
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('analytics_events' as any).insert({
        event_name: event.name,
        properties: event.properties || {},
        user_id: event.userId,
        session_id: event.sessionId,
        url: event.url,
        timestamp: new Date(event.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const formattedEvents = eventsToSend.map(event => ({
        event_name: event.name,
        properties: event.properties || {},
        user_id: event.userId,
        session_id: event.sessionId,
        url: event.url,
        timestamp: new Date(event.timestamp).toISOString()
      }));

      await supabase.from('analytics_events' as any).insert(formattedEvents);
      
      console.log(`[Analytics] Sent ${formattedEvents.length} events`);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events for retry
      this.events.unshift(...eventsToSend);
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
    this.trackEvent('user_identified', { user_id: userId });
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.events = []; // Clear pending events
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getPendingEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

export const analyticsTracker = new AnalyticsTracker();