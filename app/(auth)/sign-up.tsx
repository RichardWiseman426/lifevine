import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';

type Step = 'email' | 'code' | 'profile';

const STEP_LABELS = ['Email', 'Verify', 'Profile'];

export default function SignUpScreen() {
  const { setProfile } = useAuthStore();
  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);

  const stepIndex = ['email', 'code', 'profile'].indexOf(step);

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
      setStep('profile');
    }
  }

  // ── Step 3: set profile + password ───────────────────────────
  async function finishSetup() {
    const name  = displayName.trim();
    const uname = username.trim().toLowerCase();

    if (name.length < 1) {
      Alert.alert('Display name required', 'Please enter a name.');
      return;
    }
    if (uname.length < 3 || !/^[a-zA-Z0-9_]+$/.test(uname)) {
      Alert.alert('Invalid username', 'At least 3 characters — letters, numbers, and underscores only.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", 'Please make sure both passwords are the same.');
      return;
    }

    setLoading(true);

    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setLoading(false);
      Alert.alert('Error', pwErr.message);
      return;
    }

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
    // _layout.tsx routes to welcome screen on first sign-in
  }

  return (
    <LinearGradient
      colors={['#052218', '#0D4A2C', '#1A7A4A']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the LifeVine community.</Text>
          </View>

          {/* ── Step indicator ── */}
          <View style={styles.stepRow}>
            {STEP_LABELS.map((label, i) => {
              const done   = stepIndex > i;
              const active = stepIndex === i;
              return (
                <View key={label} style={styles.stepItem}>
                  <View style={[
                    styles.stepDot,
                    done   && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}>
                    {done
                      ? <Text style={styles.stepDotCheck}>✓</Text>
                      : <Text style={styles.stepDotNum}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={[styles.stepLabel, (active || done) && styles.stepLabelActive]}>
                    {label}
                  </Text>
                  {i < 2 && (
                    <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>

            {/* Step 1 — Email */}
            {step === 'email' && (
              <>
                <Text style={styles.cardTitle}>Enter your email</Text>
                <Text style={styles.cardSub}>We'll send a one-time code to verify it's you.</Text>

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#A8A29E"
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
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={sendCode}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Send Code</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 2 — Verify */}
            {step === 'code' && (
              <>
                <Text style={styles.cardTitle}>Check your email</Text>
                <Text style={styles.cardSub}>
                  Code sent to{' '}
                  <Text style={styles.bold}>{email}</Text>
                </Text>

                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor="#A8A29E"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={8}
                  autoFocus
                  textContentType="oneTimeCode"
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || code.trim().length < 6) && styles.btnDisabled]}
                  onPress={verifyCode}
                  disabled={loading || code.trim().length < 6}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Verify Code</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => { setStep('email'); setCode(''); }}
                >
                  <Text style={styles.linkText}>Use a different email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3 — Profile */}
            {step === 'profile' && (
              <>
                <Text style={styles.cardTitle}>Set up your profile</Text>
                <Text style={styles.cardSub}>
                  This is how others will see you in the community.
                </Text>

                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name or nickname"
                  placeholderTextColor="#A8A29E"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoComplete="name"
                  textContentType="name"
                  maxLength={80}
                  returnKeyType="next"
                />

                <Text style={styles.label}>Username</Text>
                <View style={styles.usernameRow}>
                  <View style={styles.atWrap}>
                    <Text style={styles.atSign}>@</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.usernameInput]}
                    placeholder="yourhandle"
                    placeholderTextColor="#A8A29E"
                    value={username}
                    onChangeText={(t) =>
                      setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
                    }
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
                  placeholderTextColor="#A8A29E"
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
                  placeholderTextColor="#A8A29E"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={finishSetup}
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={finishSetup}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>Create Account</Text>
                  }
                </TouchableOpacity>
              </>
            )}

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Header
  header: { marginBottom: 24 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  stepDotDone: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderColor: 'rgba(255,255,255,0.50)',
  },
  stepDotNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.70)' },
  stepDotCheck: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginLeft: 6,
  },
  stepLabelActive: { color: 'rgba(255,255,255,0.90)' },
  stepConnector: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginHorizontal: 6,
  },
  stepConnectorDone: { backgroundColor: 'rgba(255,255,255,0.55)' },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  cardSub: {
    fontSize: 13,
    color: '#78716C',
    marginBottom: 22,
    lineHeight: 19,
  },
  bold: { fontWeight: '700', color: '#1C1917' },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 7,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5DDD4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FDFAF5',
    color: '#1C1917',
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
  },

  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atWrap: {
    height: 52,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  atSign: { fontSize: 18, fontWeight: '700', color: '#78716C' },
  usernameInput: { flex: 1 },

  primaryBtn: {
    backgroundColor: '#0D4A2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.50 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },
});
