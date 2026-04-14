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
  { label: 'Healing', value: 'healing' },
  { label: 'Provision', value: 'provision' },
  { label: 'Community', value: 'community' },
  { label: 'Restoration', value: 'restoration' },
  { label: 'Salvation', value: 'salvation' },
];

export default function SubmitTestimonyScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user) { router.push('/(auth)/sign-in'); return; }
    if (title.trim().length < 3) {
      Alert.alert('Add a title', 'Please give your story a short title.');
      return;
    }
    if (body.trim().length < 50) {
      Alert.alert('Too short', 'Please share at least a few sentences (50 characters minimum).');
      return;
    }
    if (!category) {
      Alert.alert('Choose a category', 'Please select what best describes your story.');
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
      Alert.alert(
        'Story submitted!',
        'Thank you for sharing. Your story will be reviewed and published shortly.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Story</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitHeaderBtn, submitting && { opacity: 0.4 }]}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitHeaderText}>Submit</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Category */}
        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}
                onPress={() => setCategory(c.value)}
              >
                <Text style={[styles.categoryChipText, category === c.value && styles.categoryChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Give your story a short title…"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          returnKeyType="next"
        />
        <Text style={styles.charCount}>{title.length}/200</Text>

        {/* Body */}
        <Text style={styles.label}>Your Story <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Share what happened. Be as specific or as brief as feels right. Your story matters."
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          maxLength={10000}
        />
        <Text style={styles.charCount}>{body.length}/10,000 · minimum 50</Text>

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

        <Text style={styles.disclaimer}>
          All stories are reviewed before publishing. We'll notify you when yours goes live.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  cancel: { fontSize: 15, color: '#888' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  submitHeaderBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 16,
  },
  submitHeaderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1, padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 20 },
  required: { color: '#e53e3e' },
  categoryScroll: { marginBottom: 4 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  categoryChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0',
  },
  categoryChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  categoryChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#fafafa', color: '#1a1a1a',
  },
  inputMulti: { minHeight: 200 },
  charCount: { fontSize: 12, color: '#aaa', textAlign: 'right', marginTop: 4 },
  anonRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9f9f9', borderRadius: 14,
    padding: 16, marginTop: 24, gap: 14,
  },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#ddd', justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: '#2D6A4F' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', shadowColor: '#000',
    shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },
  anonText: { flex: 1 },
  anonTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  anonSub: { fontSize: 12, color: '#888', marginTop: 2 },
  disclaimer: {
    fontSize: 12, color: '#aaa', textAlign: 'center',
    marginTop: 24, marginBottom: 40, lineHeight: 18,
  },
});
