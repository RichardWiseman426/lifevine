import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry crash reporting.
 *
 * SETUP (one-time):
 *  1. Go to sentry.io → create a free account
 *  2. New Project → React Native → copy your DSN
 *  3. Add to .env.local:   EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@oXXX.ingest.sentry.io/XXXXX
 *  4. Add to EAS secrets:  eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-dsn"
 *
 * Until the DSN is set, Sentry is silently disabled — the app works normally.
 */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn || dsn.includes('REPLACE')) {
    if (__DEV__) console.log('[Sentry] DSN not configured — crash reporting disabled');
    return;
  }

  Sentry.init({
    dsn,
    // Only send events in production builds
    enabled: !__DEV__,
    // Capture unhandled promise rejections
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
    // Performance tracing — 10% sample rate to start
    tracesSampleRate: 0.1,
    // Don't clutter logs during development
    debug: false,
  });
}

export { Sentry };
