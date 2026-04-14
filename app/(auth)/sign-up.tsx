import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';

type Step = 'email' | 'code' | 'profile';

export default function SignUpScreen() {
  const { user, setProfile } = useAuthStore();
  const [step, setStep]           = useState<Step>('email');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);

  // ── Step 1: send OTP ──────────────────────────────────────────
  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('code');
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────────
  async function verifyCode() {
    if (code.trim().length < 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Invalid code', 'Please check the code and try again.');
    } else {
      // Verified — now let them set their profile + password
      setStep('profile');
    }
  }

  // ── Step 3: set profile + password ───────────────────────────
  async function finishSetup() {
    const name = displayName.trim();
    const uname = username.trim().toLowerCase();

    if (name.length < 1) {
      Alert.alert('Display name required', 'Please enter a name.');
      return;
    }
    if (uname.length < 3 || !/^[a-zA-Z0-9_]+$/.test(uname)) {
      Alert.alert('Invalid username', 'Username must be at least 3 characters and contain only letters, numbers, and underscores.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords are the same.');
      return;
    }

    setLoading(true);

    // Set password on the auth account
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setLoading(false);
      Alert.alert('Error', pwErr.message);
      return;
    }

    // Update the profile row (trigger already created it with placeholders)
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setLoading(false);
      Alert.alert('Error', 'Could not find your account. Please try again.');
      return;
    }

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .update({ display_name: name, username: uname, onboarding_complete: true })
      .eq('id', userId)
      .select()
      .single();

    setLoading(false);

    if (profileErr) {
      if (profileErr.code === '23505') {
        Alert.alert('Username taken', 'That username is already in use. Please choose another.');
      } else {
        Alert.alert('Error', profileErr.message);
      }
      return;
    }

    if (profileData) setProfile(profileData);
    // _layout.tsx auth listener will route to intent gate / tabs
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>

        {/* ── Step indicator ── */}
        <View style={styles.steps}>
          {(['email', 'code', 'profile'] as Step[]).map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, step === s && styles.stepDotActive,
                (['email','code','profile'].indexOf(step) > i) && styles.stepDotDone]}>
                <Text style={styles.stepDotText}>{i + 1}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine,
                (['email','code','profile'].indexOf(step) > i) && styles.stepLineDone]} />}
            </View>
          ))}
        </View>

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <>
            <Text style={styles.stepTitle}>Enter your email</Text>
            <Text style={styles.stepSub}>We'll send a one-time code to verify it's you.</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={sendCode}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={sendCode}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send Code</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 2: Verify code ── */}
        {step === 'code' && (
          <>
            <Text style={styles.stepTitle}>Check your email</Text>
            <Text style={styles.stepSub}>
              We sent a sign-in code to{' '}
              <Text style={styles.bold}>{email}</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
              textContentType="oneTimeCode"
            />
            <TouchableOpacity
              style={[styles.button, (loading || code.trim().length < 6) && styles.buttonDisabled]}
              onPress={verifyCode}
              disabled={loading || code.trim().length < 6}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Verify Code</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => { setStep('email'); setCode(''); }}
            >
              <Text style={styles.linkText}>← Use a different email</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 3: Profile + password ── */}
        {step === 'profile' && (
          <>
            <Text style={styles.stepTitle}>Set up your account</Text>
            <Text style={styles.stepSub}>This is how others will see you. You won't need a code to sign in again.</Text>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name or nickname"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              textContentType="name"
              maxLength={80}
              returnKeyType="next"
            />

            <Text style={styles.label}>Username</Text>
            <View style={styles.usernameRow}>
              <Text style={styles.usernameAt}>@</Text>
              <TextInput
                style={[styles.input, styles.usernameInput]}
                placeholder="yourhandle"
                value={username}
                onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={finishSetup}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={finishSetup}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Create Account</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#1a1a1a', marginBottom: 28 },

  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#2D6A4F' },
  stepDotDone: { backgroundColor: '#2D6A4F' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#2D6A4F' },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  stepSub: { fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1a1a1a' },

  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 16, backgroundColor: '#fafafa', color: '#1a1a1a',
  },
  codeInput: { fontSize: 28, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },

  usernameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  usernameAt: { fontSize: 18, fontWeight: '700', color: '#555', marginRight: 4, marginBottom: 16 },
  usernameInput: { flex: 1, marginBottom: 16 },

  button: {
    backgroundColor: '#2D6A4F', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },
});
