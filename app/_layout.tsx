import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { Stack, useRouter, useSegments, ErrorBoundaryProps } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';
import { useSettingsStore } from '../src/store/settings';
import { initSentry, Sentry } from '../src/lib/sentry';
import { ErrorFallback } from '../src/components/ErrorBoundary';

// Handle notifications received while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// Initialise Sentry as early as possible — before any component renders
initSentry();

// Expo Router uses this export to wrap the entire app in an error boundary.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} onRetry={retry} />;
}

function RootLayout() {
  const { setSession, setProfile, session, isLoading } = useAuthStore();
  const { hasSeenWelcome, loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const router = useRouter();
  const segments = useSegments();

  // Load persisted settings once on boot
  useEffect(() => {
    loadSettings();
  }, []);

  // Refresh badge when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { profile } = useAuthStore.getState();
        refreshBadge(profile?.platform_role);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Route guard
  useEffect(() => {
    if (isLoading || !settingsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onWelcome   = segments[0] === 'welcome';

    // Not signed in → always go to sign-in
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // Just signed in / signed up through auth screens
    if (session && inAuthGroup) {
      if (!hasSeenWelcome) {
        router.replace('/welcome');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    // Session restored on app reopen (segments is empty) — go straight to tabs
    if (session && !inAuthGroup && !onWelcome && (segments as string[]).length === 0) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, settingsLoaded, segments, hasSeenWelcome]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    if (data) {
      registerPushToken(userId);
      refreshBadge(data.platform_role);
    }
  }

  async function registerPushToken(userId: string) {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    } catch {
      // Unavailable in some environments — fail silently
    }
  }

  async function refreshBadge(role?: string) {
    try {
      // Only admins/moderators get badge counts for pending applications
      if (role !== 'super_admin' && role !== 'moderator') {
        await Notifications.setBadgeCountAsync(0);
        return;
      }
      const { count } = await supabase
        .from('contributor_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      await Notifications.setBadgeCountAsync(count ?? 0);
    } catch {
      // Fail silently
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="conversations" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="submit-testimony" options={{ presentation: 'modal' }} />
      <Stack.Screen name="admin" />
      <Stack.Screen name="org" />
      <Stack.Screen name="event" />
      <Stack.Screen name="opportunity" />
      <Stack.Screen name="testimony" />
      <Stack.Screen name="resource" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="support" />
      <Stack.Screen name="upgrade" />
      <Stack.Screen name="manage-org" />
      <Stack.Screen name="opportunity-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="opportunity-responses" />
      <Stack.Screen name="event-form" options={{ presentation: 'modal' }} />
      {/* intent-gate and emergency screens are preserved on disk but unrouted.
          To restore: add Stack.Screen entries here and re-wire routing above. */}
    </Stack>
  );
}

export default Sentry.wrap(RootLayout);
