import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

const CATEGORIES = [
  { label: 'Healing',     value: 'healing',     icon: '❤️‍🩹', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Provision',   value: 'provision',   icon: '🙏',    color: '#10B981', bg: '#ECFDF5' },
  { label: 'Community',   value: 'community',   icon: '👥',    color: '#3B82F6', bg: '#EFF6FF' },
  { label: 'Restoration', value: 'restoration', icon: '🌱',    color: '#EC4899', bg: '#FDF2F8' },
  { label: 'Salvation',   value: 'salvation',   icon: '✨',    color: '#8B5CF6', bg: '#F5F3FF' },
];

export default function SubmitTestimonyScreen() {
  const { user, profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }
    if (!category) {
      Alert.alert('Choose a category', 'Select what best describes your story.');
      return;
    }
    if (title.trim().length < 3) {
      Alert.alert('Add a title', 'Give your story a short title.');
      return;
    }
    if (body.trim().length < 50) {
      Alert.alert('Too short', 'Please share at least a few sentences (50 characters minimum).');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('testimonies').insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      category,
      is_anonymous: isAnonymous,
      status: 'pending_review',
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSubmitted(true);
    }
  }

  // ── Success screen ──────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>🌿</Text>
          <Text style={styles.successTitle}>Story submitted.</Text>
          <Text style={styles.successBody}>
            Thank you for sharing, {profile?.first_name ?? 'friend'}. Your story will be
            reviewed and published shortly. It may encourage someone more than you know.
          </Text>
          <View style={styles.successVerse}>
            <Text style={styles.successVerseText}>
              "They triumphed over him by the blood of the Lamb{'\n'}and by the word of their testimony."
            </Text>
            <Text style={styles.successVerseRef}>— Revelation 12:11</Text>
          </View>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.back()}>
            <Text style={styles.successBtnText}>Back to Community</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Story</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.headerSubmitBtn, submitting && { opacity: 0.5 }]}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.headerSubmitText}>Submit</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            What has God done in your life? What has this community meant to you?
            Your experience — big or small — matters here.
          </Text>
        </View>

        {/* Category */}
        <Text style={styles.label}>What kind of story is this? <Text style={styles.req}>*</Text></Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.categoryChip,
                  active && { backgroundColor: c.bg, borderColor: c.color },
                ]}
                onPress={() => setCategory(c.value)}
                activeOpacity={0.75}
              >
                <Text style={styles.categoryChipIcon}>{c.icon}</Text>
                <Text style={[styles.categoryChipText, active && { color: c.color, fontWeight: '700' }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Give your story a short title…"
          placeholderTextColor="#A8A29E"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          returnKeyType="next"
        />
        <Text style={styles.charCount}>{title.length}/200</Text>

        {/* Body */}
        <Text style={styles.label}>Your Story <Text style={styles.req}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.inputTall]}
          placeholder="Share what happened. Be as specific or as brief as feels right. Your story matters."
          placeholderTextColor="#A8A29E"
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          maxLength={10000}
        />
        <Text style={styles.charCount}>{body.length}/10,000 · minimum 50 characters</Text>

        {/* Anonymous toggle */}
        <TouchableOpacity
          style={styles.anonRow}
          onPress={() => setIsAnonymous(!isAnonymous)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggle, isAnonymous && styles.toggleOn]}>
            <View style={[styles.toggleThumb, isAnonymous && styles.toggleThumbOn]} />
          </View>
          <View style={styles.anonText}>
            <Text style={styles.anonTitle}>Share anonymously</Text>
            <Text style={styles.anonSub}>Your name won't appear publicly with this story.</Text>
          </View>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          All stories are reviewed before publishing. We'll notify you when yours goes live.
        </Text>

        {/* Bottom submit button */}
        <TouchableOpacity
          style={[styles.submitBottomBtn, submitting && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitBottomText}>Submit My Story</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
  },
  headerCancel: { fontSize: 15, color: '#A8A29E', fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  headerSubmitBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 16,
    minWidth: 68, alignItems: 'center',
  },
  headerSubmitText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 56 },

  // Intro card
  introCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#E5DDD4',
  },
  introText: { fontSize: 14, color: '#57534E', lineHeight: 22, fontStyle: 'italic' },

  // Fields
  label: { fontSize: 13, fontWeight: '700', color: '#57534E', marginBottom: 10, marginTop: 8 },
  req: { color: '#DC2626' },
  input: {
    borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#FFFFFF', color: '#1C1917',
  },
  inputTall: { minHeight: 200, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#A8A29E', textAlign: 'right', marginTop: 4, marginBottom: 8 },

  // Categories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E5DDD4',
  },
  categoryChipIcon: { fontSize: 16 },
  categoryChipText: { fontSize: 13, color: '#78716C', fontWeight: '500' },

  // Anonymous toggle
  anonRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginTop: 16, gap: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
  },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#E5DDD4', justifyContent: 'center', padding: 2, flexShrink: 0,
  },
  toggleOn: { backgroundColor: '#2D6A4F' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },
  anonText: { flex: 1 },
  anonTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  anonSub: { fontSize: 12, color: '#A8A29E', marginTop: 2 },

  disclaimer: {
    fontSize: 12, color: '#A8A29E', textAlign: 'center',
    marginTop: 20, lineHeight: 18,
  },

  // Bottom submit button
  submitBottomBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  submitBottomText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  // Success screen
  successWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#1C1917', marginBottom: 14, letterSpacing: -0.5 },
  successBody: {
    fontSize: 15, color: '#57534E', textAlign: 'center',
    lineHeight: 24, marginBottom: 28,
  },
  successVerse: {
    backgroundColor: '#F0FDF4', borderRadius: 18, padding: 22,
    borderWidth: 1, borderColor: '#BBF7D0',
    alignItems: 'center', marginBottom: 32, width: '100%',
  },
  successVerseText: {
    fontSize: 15, fontStyle: 'italic', color: '#1C1917',
    textAlign: 'center', lineHeight: 24, marginBottom: 10, fontWeight: '500',
  },
  successVerseRef: { fontSize: 13, color: '#2E7D32', fontWeight: '700' },
  successBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 40,
  },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
