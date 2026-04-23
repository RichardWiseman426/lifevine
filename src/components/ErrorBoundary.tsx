import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

// ─── Fallback UI ─────────────────────────────────────────────────────────────
// Used both by the class ErrorBoundary below and as the Expo Router
// ErrorBoundary export in each layout file.

type FallbackProps = {
  error: Error;
  onRetry?: () => void;
};

export function ErrorFallback({ error, onRetry }: FallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconMark}>
        <View style={styles.iconMarkInner} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>
        We hit an unexpected error. This has been reported and we'll look into it.
      </Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.8}
      >
        <Text style={styles.homeText}>Go to Home</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <ScrollView style={styles.devBox} contentContainerStyle={{ padding: 12 }}>
          <Text style={styles.devTitle}>DEV — Error Details</Text>
          <Text style={styles.devText}>{error.message}</Text>
          {error.stack ? (
            <Text style={styles.devStack}>{error.stack}</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Class-based boundary (for manual wrapping) ───────────────────────────────
type BoundaryProps = { children: React.ReactNode; fallback?: React.ReactNode };
type BoundaryState = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Sentry picks this up automatically when initialized — no manual call needed
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  retry = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} onRetry={this.retry} />;
    }
    return this.props.children;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconMark: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#E2F0E8',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  iconMarkInner: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2D6A4F', opacity: 0.7,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#1C1917',
    marginBottom: 10, textAlign: 'center', letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14, color: '#78716C', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  retryBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32, marginBottom: 10,
  },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  homeBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    borderWidth: 1, borderColor: '#D5CFC8',
  },
  homeText: { color: '#57534E', fontSize: 15, fontWeight: '600' },

  // Dev-only error dump
  devBox: {
    marginTop: 24, backgroundColor: '#1C1917', borderRadius: 8,
    maxHeight: 220, width: '100%',
  },
  devTitle: { color: '#F59E0B', fontWeight: '800', fontSize: 11, marginBottom: 6 },
  devText: { color: '#FCA5A5', fontSize: 11, marginBottom: 8 },
  devStack: { color: '#A3A3A3', fontSize: 10, lineHeight: 16 },
});
