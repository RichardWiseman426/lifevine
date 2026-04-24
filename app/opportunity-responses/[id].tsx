import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { BackHeader } from '../../src/components/BackHeader';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  accepted:  { bg: '#D1FAE5', text: '#065F46' },
  declined:  { bg: '#FEE2E2', text: '#991B1B' },
  withdrawn: { bg: '#F3F4F6', text: '#6B7280' },
  completed: { bg: '#EDE9FE', text: '#5B21B6' },
};

export default function OpportunityResponsesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [oppTitle, setOppTitle] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [oppRes, resRes] = await Promise.all([
      supabase.from('opportunities').select('title').eq('id', id).single(),
      supabase.from('opportunity_responses')
        .select(`
          id, status, message, availability_notes, responded_at,
          profiles ( display_name, username, avatar_url )
        `)
        .eq('opportunity_id', id)
        .order('responded_at', { ascending: false }),
    ]);

    if (oppRes.data) setOppTitle(oppRes.data.title);
    setResponses(resRes.data ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function updateStatus(responseId: string, status: 'accepted' | 'declined') {
    setUpdating(responseId);
    const { error } = await supabase
      .from('opportunity_responses')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', responseId);
    setUpdating(null);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setResponses((prev) =>
        prev.map((r) => (r.id === responseId ? { ...r, status } : r))
      );
    }
  }

  const pending   = responses.filter((r) => r.status === 'pending');
  const reviewed  = responses.filter((r) => r.status !== 'pending');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title="Responses" />

      {loading ? (
        <View style={s.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {oppTitle ? (
            <Text style={s.oppTitle} numberOfLines={2}>{oppTitle}</Text>
          ) : null}

          {responses.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No responses yet</Text>
              <Text style={s.emptyBody}>
                People who tap "I Want to Help" on this opportunity will appear here.
              </Text>
            </View>
          ) : (
            <>
              {/* ── Pending ── */}
              {pending.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>NEEDS REVIEW ({pending.length})</Text>
                  {pending.map((r) => (
                    <ResponseRow
                      key={r.id}
                      response={r}
                      updating={updating === r.id}
                      onAccept={() => updateStatus(r.id, 'accepted')}
                      onDecline={() => updateStatus(r.id, 'declined')}
                    />
                  ))}
                </View>
              )}

              {/* ── Reviewed ── */}
              {reviewed.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>REVIEWED ({reviewed.length})</Text>
                  {reviewed.map((r) => (
                    <ResponseRow
                      key={r.id}
                      response={r}
                      updating={updating === r.id}
                      onAccept={() => updateStatus(r.id, 'accepted')}
                      onDecline={() => updateStatus(r.id, 'declined')}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ResponseRow({
  response: r, updating, onAccept, onDecline,
}: {
  response: any;
  updating: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const profile = r.profiles;
  const name = profile?.display_name ?? profile?.username ?? 'Anonymous';
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const color = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;
  const date = r.responded_at
    ? new Date(r.responded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View style={r_s.wrap}>
      <View style={r_s.top}>
        {/* Avatar */}
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={r_s.avatar} />
        ) : (
          <View style={r_s.avatarFallback}>
            <Text style={r_s.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={r_s.nameBlock}>
          <Text style={r_s.name}>{name}</Text>
          {date ? <Text style={r_s.date}>{date}</Text> : null}
        </View>

        <View style={[r_s.statusBadge, { backgroundColor: color.bg }]}>
          <Text style={[r_s.statusText, { color: color.text }]}>
            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          </Text>
        </View>
      </View>

      {r.message ? (
        <Text style={r_s.message}>{r.message}</Text>
      ) : null}

      {r.availability_notes ? (
        <Text style={r_s.notes}>Availability: {r.availability_notes}</Text>
      ) : null}

      {r.status === 'pending' && (
        <View style={r_s.actions}>
          {updating ? (
            <ActivityIndicator color="#2D6A4F" size="small" />
          ) : (
            <>
              <TouchableOpacity style={r_s.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
                <Text style={r_s.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={r_s.declineBtn} onPress={onDecline} activeOpacity={0.8}>
                <Text style={r_s.declineText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },
  oppTitle: {
    fontSize: 17, fontWeight: '800', color: '#1C1917',
    marginBottom: 16, lineHeight: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },
  empty: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5DDD4',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#78716C', marginBottom: 8 },
  emptyBody: { fontSize: 13, color: '#A8A29E', textAlign: 'center', lineHeight: 20 },
});

const r_s = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#E5DDD4',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#2D6A4F', fontWeight: '800', fontSize: 14 },
  nameBlock: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  date: { fontSize: 12, color: '#A8A29E', marginTop: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  message: { fontSize: 13, color: '#57534E', lineHeight: 20, marginBottom: 6 },
  notes: { fontSize: 12, color: '#78716C', fontStyle: 'italic', marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  acceptBtn: {
    flex: 1, backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  declineBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  declineText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
});
