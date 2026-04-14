import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useTestimony } from '../../src/hooks/useTestimonies';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function TestimonyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { testimony: t, responses, loading } = useTestimony(id);
  const { user } = useAuthStore();
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitResponse() {
    if (!user) { router.push('/(auth)/sign-in'); return; }
    if (responseText.trim().length < 5) return;
    setSubmitting(true);
    const { error } = await supabase.from('testimony_responses').insert({
      testimony_id: id,
      author_id: user.id,
      body: responseText.trim(),
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setResponseText('');
      Alert.alert('Sent', 'Your response has been submitted for review. Thank you.');
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (!t) {
    return <View style={styles.centered}><Text>Story not found.</Text></View>;
  }

  const authorName = t.is_anonymous ? 'Anonymous' : (t.profiles?.display_name ?? 'Someone');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Category */}
        <View style={styles.chip}>
          <Text style={styles.chipText}>{t.category.charAt(0).toUpperCase() + t.category.slice(1)}</Text>
        </View>

        <Text style={styles.title}>{t.title}</Text>

        <View style={styles.authorRow}>
          <View style={styles.authorDot} />
          <Text style={styles.author}>{authorName}</Text>
          {t.organizations?.name && <Text style={styles.orgName}> · {t.organizations.name}</Text>}
          <Text style={styles.date}> · {formatDate(t.created_at)}</Text>
        </View>

        <View style={styles.bodySection}>
          <Text style={styles.body}>{t.body}</Text>
        </View>

        {/* Responses */}
        {responses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{responses.length} Response{responses.length !== 1 ? 's' : ''}</Text>
            {responses.map((r: any) => (
              <View key={r.id} style={styles.responseCard}>
                <Text style={styles.responseName}>{r.profiles?.display_name ?? 'Someone'}</Text>
                <Text style={styles.responseBody}>{r.body}</Text>
                <Text style={styles.responseDate}>{formatDate(r.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add response */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave an Encouragement</Text>
          <TextInput
            style={styles.responseInput}
            placeholder="Write something encouraging…"
            value={responseText}
            onChangeText={setResponseText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || responseText.trim().length < 5) && styles.submitBtnDisabled]}
            onPress={submitResponse}
            disabled={submitting || responseText.trim().length < 5}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Sending…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 48 },
  back: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  chip: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 12 },
  chipText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  authorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D6A4F', marginRight: 6 },
  author: { fontSize: 13, fontWeight: '700', color: '#555' },
  orgName: { fontSize: 13, color: '#888' },
  date: { fontSize: 13, color: '#aaa' },
  bodySection: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14 },
  body: { fontSize: 16, color: '#222', lineHeight: 26 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  responseCard: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12 },
  responseName: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  responseBody: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 4 },
  responseDate: { fontSize: 12, color: '#aaa' },
  responseInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 80, marginBottom: 12, backgroundColor: '#fafafa',
  },
  submitBtn: { backgroundColor: '#2D6A4F', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
