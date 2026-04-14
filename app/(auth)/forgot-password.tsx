import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Step 1: send OTP ──────────────────────────────────────────
  async function sendCode() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: false }, // don't create if not found
    });
    setLoading(false);
    if (error) {
      // Give a vague message for security — don't reveal if email exists
      Alert.alert('Check your email', 'If an account exists for that email, a code has been sent.');
    }
    // Always advance to code step (don't reveal if email exists)
    setStep('code');
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
      setStep('password');
    }
  }

  // ── Step 3: set new password ─────────────────────────────────
  async function setNewPassword() {
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", 'Please make sure both passwords are the same.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Password updated!',
        'Your password has been changed. You can now sign in with your new password.',
        [{ text: 'Sign in', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    }
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
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <>
            <Text style={styles.stepSub}>
              Enter the email address on your account and we'll send you a code.
            </Text>
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
          </>
        )}

        {/* ── Step 2: Code ── */}
        {step === 'code' && (
          <>
            <Text style={styles.stepSub}>
              Enter the code we sent to{' '}
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
              <Text style={styles.linkText}>← Try a different email</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === 'password' && (
          <>
            <Text style={styles.stepSub}>
              Choose a new password for your account.
            </Text>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              autoFocus
              returnKeyType="next"
            />
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat your new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={setNewPassword}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={setNewPassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Update Password</Text>
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
  back: { marginBottom: 24 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  stepSub: { fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#1a1a1a' },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 16, backgroundColor: '#fafafa', color: '#1a1a1a',
  },
  codeInput: { fontSize: 28, fontWeight: '700', letterSpacing: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#2D6A4F', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },
});
