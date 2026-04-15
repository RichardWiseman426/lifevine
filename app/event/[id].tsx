import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { BackHeader } from '../../src/components/BackHeader';
import { useEvent } from '../../src/hooks/useEvents';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event: ev, occurrences, loading } = useEvent(id);
  const { user } = useAuthStore();

  async function handleRsvp(occurrenceId: string) {
    if (!user) { router.push('/(auth)/sign-in'); return; }
    const { error } = await supabase.from('event_rsvps').insert({
      occurrence_id: occurrenceId,
      user_id: user.id,
      guest_count: 1,
    });
    if (error?.code === '23505') {
      Alert.alert('Already registered', 'You are already registered for this event.');
    } else if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('You\'re registered!', 'We\'ll see you there.');
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (!ev) {
    return <View style={styles.centered}><Text>Event not found.</Text></View>;
  }

  const location = ev.is_virtual ? 'Online' : [ev.city, ev.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Event" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{ev.category.replace(/_/g, ' ')}</Text>
          </View>
          {ev.is_virtual && <View style={[styles.chip, styles.virtualChip]}><Text style={[styles.chipText, styles.virtualChipText]}>Online</Text></View>}
        </View>

        <Text style={styles.title}>{ev.title}</Text>
        {ev.organizations?.name && (
          <TouchableOpacity onPress={() => router.push(`/org/${ev.org_id}`)}>
            <Text style={styles.orgLink}>{ev.organizations.name} →</Text>
          </TouchableOpacity>
        )}

        {location ? <Text style={styles.meta}>📍 {location}</Text> : null}
        {ev.max_attendees ? <Text style={styles.meta}>👥 Up to {ev.max_attendees} attendees</Text> : null}

        {ev.description ? (
          <View style={styles.section}>
            <Text style={styles.body}>{ev.description}</Text>
          </View>
        ) : null}

        {/* Upcoming dates */}
        {occurrences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Dates</Text>
            {occurrences.map((occ: any) => (
              <View key={occ.id} style={styles.occRow}>
                <View style={styles.occInfo}>
                  <Text style={styles.occDate}>{formatDateTime(occ.starts_at)}</Text>
                  {occ.rsvp_count > 0 && (
                    <Text style={styles.occRsvp}>{occ.rsvp_count} attending</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.rsvpBtn} onPress={() => handleRsvp(occ.id)}>
                  <Text style={styles.rsvpBtnText}>RSVP</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Virtual link */}
        {ev.is_virtual && ev.virtual_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join Online</Text>
            <TouchableOpacity onPress={() => Linking.openURL(ev.virtual_url)}>
              <Text style={styles.contactLink}>🔗 Join Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Org contact */}
        {ev.organizations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted By</Text>
            <Text style={styles.contactName}>{ev.organizations.name}</Text>
            {ev.organizations.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${ev.organizations.phone}`)}>
                <Text style={styles.contactLink}>📞 {ev.organizations.phone}</Text>
              </TouchableOpacity>
            )}
            {ev.organizations.email && (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${ev.organizations.email}`)}>
                <Text style={styles.contactLink}>✉️ {ev.organizations.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  virtualChip: { backgroundColor: '#EEF2FF' },
  virtualChipText: { color: '#4338CA' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  orgLink: { fontSize: 14, color: '#2D6A4F', fontWeight: '600', marginBottom: 10 },
  meta: { fontSize: 13, color: '#888', marginBottom: 6 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  occRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  occInfo: { flex: 1 },
  occDate: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  occRsvp: { fontSize: 12, color: '#888', marginTop: 2 },
  rsvpBtn: { backgroundColor: '#2D6A4F', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  rsvpBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  contactLink: { fontSize: 15, color: '#2D6A4F', marginBottom: 8 },
});
