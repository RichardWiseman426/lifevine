import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    const e = email.trim().toLowerCase();
    if (!e || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', 'Incorrect email or password. Try again or reset your password.');
    }
    // On success _layout.tsx listener handles routing
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
        {/* Hero / wordmark area */}
        <View style={styles.hero}>
          <Text style={styles.wordmark}>LifeVine</Text>
          <Text style={styles.tagline}>Connect. Serve. Belong.</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>
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
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor="#A8A29E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.secondaryButtonText}>Create an Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F0E8' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },

  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  wordmark: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2D6A4F',
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#78716C',
    letterSpacing: 0.5,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 7,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DDD4',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FDFAF5',
    color: '#1C1917',
  },
  button: {
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5DDD4' },
  dividerText: { fontSize: 13, color: '#A8A29E' },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: { color: '#2D6A4F', fontSize: 16, fontWeight: '700' },
});
