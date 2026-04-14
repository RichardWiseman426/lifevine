import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useOpportunity } from '../../src/hooks/useOpportunities';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';

const ACTION_TYPE_LABELS: Record<string, string> = {
  phone: 'Call', email: 'Email', form: 'Fill Out Form',
  show_up: 'Show Up', read: 'Read', link: 'Learn More',
};

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { opportunity: o, steps, loading } = useOpportunity(id);
  const { user } = useAuthStore();

  async function handleRespond() {
    if (!user) { router.push('/(auth)/sign-in'); return; }
    const { error } = await supabase.from('opportunity_responses').insert({
      opportunity_id: id,
      user_id: user.id,
      status: 'pending',
    });
    if (error?.code === '23505') {
      Alert.alert('Already signed up', 'You have already responded to this opportunity.');
    } else if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('You\'re signed up!', 'The organization will be in touch. Thank you for serving.');
    }
  }

  function handleStep(step: any) {
    if (!step.action_url) return;
    switch (step.action_type) {
      case 'phone': Linking.openURL(`tel:${step.action_url}`); break;
      case 'email': Linking.openURL(`mailto:${step.action_url}`); break;
      default: Linking.openURL(step.action_url);
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (!o) {
    return <View style={styles.centered}><Text>Opportunity not found.</Text></View>;
  }

  const spotsLeft = o.spots_total != null ? o.spots_total - o.spots_filled : null;
  const location = o.is_remote ? 'Remote' : [o.city, o.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header info */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{o.category.replace(/_/g, ' ')}</Text>
          </View>
          {spotsLeft != null && (
            <Text style={[styles.spots, spotsLeft <= 3 && styles.spotsCritical]}>
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </Text>
          )}
        </View>

        <Text style={styles.title}>{o.title}</Text>
        {o.organizations?.name && (
          <TouchableOpacity onPress={() => router.push(`/org/${o.org_id}`)}>
            <Text style={styles.orgLink}>{o.organizations.name} →</Text>
          </TouchableOpacity>
        )}

        {/* Meta */}
        <View style={styles.metaRow}>
          {location ? <Text style={styles.meta}>📍 {location}</Text> : null}
          {o.commitment_description ? <Text style={styles.meta}>⏱ {o.commitment_description}</Text> : null}
          {o.starts_at ? <Text style={styles.meta}>📅 {new Date(o.starts_at).toLocaleDateString()}</Text> : null}
        </View>

        {/* Description */}
        {o.description ? (
          <View style={styles.section}>
            <Text style={styles.body}>{o.description}</Text>
          </View>
        ) : null}

        {/* Action steps */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Help</Text>
            {steps.map((step: any, i: number) => (
              <View key={step.id} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  {step.description ? <Text style={styles.stepDesc}>{step.description}</Text> : null}
                  {step.action_url ? (
                    <TouchableOpacity style={styles.stepBtn} onPress={() => handleStep(step)}>
                      <Text style={styles.stepBtnText}>
                        {step.action_label ?? ACTION_TYPE_LABELS[step.action_type] ?? 'Take Action'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Contact */}
        {(o.contact_name || o.contact_email || o.contact_phone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {o.contact_name ? <Text style={styles.contactName}>{o.contact_name}</Text> : null}
            {o.contact_phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.contact_phone}`)}>
                <Text style={styles.contactLink}>📞 {o.contact_phone}</Text>
              </TouchableOpacity>
            ) : null}
            {o.contact_email ? (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${o.contact_email}`)}>
                <Text style={styles.contactLink}>✉️ {o.contact_email}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Sticky respond button */}
      {spotsLeft !== 0 && (
        <View style={styles.stickyBar}>
          <TouchableOpacity style={styles.respondBtn} onPress={handleRespond}>
            <Text style={styles.respondBtnText}>I Want to Help</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 100 },
  back: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  chip: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  spots: { fontSize: 13, color: '#888', fontWeight: '500' },
  spotsCritical: { color: '#e53e3e', fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  orgLink: { fontSize: 14, color: '#2D6A4F', fontWeight: '600', marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  meta: { fontSize: 13, color: '#888' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  step: { flexDirection: 'row', marginBottom: 16 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2D6A4F',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0, marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },
  stepBtn: { backgroundColor: '#2D6A4F', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  stepBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  contactLink: { fontSize: 15, color: '#2D6A4F', marginBottom: 8 },
  stickyBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  respondBtn: { backgroundColor: '#2D6A4F', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  respondBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
