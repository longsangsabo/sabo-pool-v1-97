import * as Sentry from '@sentry/react';

const SENTRY_DSN = 'YOUR_SENTRY_DSN'; // This will be replaced with actual DSN

export const initSentry = () => {
  if (SENTRY_DSN && SENTRY_DSN !== 'YOUR_SENTRY_DSN') {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of the transactions in development
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      environment: import.meta.env.DEV ? 'development' : 'production',
      beforeSend(event) {
        // Filter out errors in development
        if (import.meta.env.DEV) {
          console.log('Sentry event:', event);
        }
        return event;
      },
    });
  }
};

// Export Sentry for use in other parts of the app
export { Sentry };