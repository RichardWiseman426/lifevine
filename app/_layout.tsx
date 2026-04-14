import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';
import { useSettingsStore } from '../src/store/settings';
import { useIntentStore } from '../src/store/intent';

export default function RootLayout() {
  const { setSession, setProfile, session, isLoading } = useAuthStore();
  const { skipIntentGate, loaded: settingsLoaded, loadSettings } = useSettingsStore();
  const { needsGate, setNeedsGate } = useIntentStore();
  const router = useRouter();
  const segments = useSegments();

  // Load persisted settings once on boot
  useEffect(() => {
    loadSettings();
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
          // Mark that we need the intent gate on fresh sign-in
          if (event === 'SIGNED_IN') setNeedsGate(true);
        } else {
          setProfile(null);
          setNeedsGate(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Route guard
  useEffect(() => {
    if (isLoading || !settingsLoaded) return;

    const inAuthGroup    = segments[0] === '(auth)';
    const onIntentGate   = segments[0] === 'intent-gate';
    const onConversation = segments[0] === 'conversation';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (session && inAuthGroup) {
      // Fresh login: decide whether to show intent gate
      if (needsGate && !skipIntentGate) {
        router.replace('/intent-gate');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    // After restoring a session (app reopen, not fresh login): go straight to tabs
    if (session && !inAuthGroup && !onIntentGate && !onConversation && segments.length === 0) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, settingsLoaded, segments, needsGate, skipIntentGate]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="intent-gate" options={{ animation: 'fade' }} />
      <Stack.Screen name="emergency" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="conversations" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="submit-testimony" options={{ presentation: 'modal' }} />
      <Stack.Screen name="admin" />
      <Stack.Screen name="org" />
      <Stack.Screen name="event" />
      <Stack.Screen name="opportunity" />
      <Stack.Screen name="testimony" />
      <Stack.Screen name="resource" />
    </Stack>
  );
}
