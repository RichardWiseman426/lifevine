import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
          {/* ── Brand ── */}
          <View style={styles.brandBlock}>
            <Image
              source={require('../../assets/brand/images/app-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Connect. Serve. Belong.</Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

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
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Create account ── */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Create an Account</Text>
          </TouchableOpacity>

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

  // Brand
  brandBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 22,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.8,
    fontWeight: '500',
  },

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
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 22,
    letterSpacing: -0.5,
  },

  label: {
    fontSize: 12,
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

  primaryBtn: {
    backgroundColor: '#0D4A2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#2D6A4F', fontSize: 14, fontWeight: '600' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.20)' },
  dividerText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // Secondary
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.40)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
