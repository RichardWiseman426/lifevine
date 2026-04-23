import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { BackHeader } from '../../src/components/BackHeader';

const STATUS_COLOR: Record<string, string> = {
  open: '#2D6A4F', draft: '#A8A29E', filled: '#B8864E',
  closed: '#78716C', archived: '#D4C4B0',
};

const OPP_LABELS: Record<string, string> = {
  volunteer: 'Volunteer', service: 'Service',
  community_need: 'Community Need', prayer: 'Prayer', mentorship: 'Mentorship',
};

const EVT_LABELS: Record<string, string> = {
  service: 'Service', community: 'Community', support: 'Support',
  workshop: 'Workshop', youth: 'Youth',
};

export default function ManageOrgScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [orgName, setOrgName] = useState('');
  const [opps, setOpps] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [orgRes, oppRes, evtRes] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', id).single(),
      supabase.from('opportunities')
        .select('id, title, category, status, spots_total, spots_filled')
        .eq('org_id', id).is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('events')
        .select('id, title, category, is_virtual, city, state')
        .eq('org_id', id).is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ]);
    if (orgRes.data) setOrgName(orgRes.data.name);
    setOpps(oppRes.data ?? []);
    setEvents(evtRes.data ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmDelete(
    table: string, itemId: string, title: string, onDone: () => void
  ) {
    Alert.alert('Delete', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', itemId);
          onDone();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title={orgName ? `Manage — ${orgName}` : 'Manage'} />

      {loading ? (
        <View style={s.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Opportunities ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Opportunities</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => router.push(`/opportunity-form?orgId=${id}`)}
              >
                <Text style={s.addBtnText}>+ New</Text>
              </TouchableOpacity>
            </View>

            {opps.length === 0 ? (
              <Text style={s.empty}>
                No opportunities yet. Add one to let people know how they can help.
              </Text>
            ) : opps.map((o) => (
              <View key={o.id} style={s.item}>
                <TouchableOpacity
                  style={s.itemMain}
                  onPress={() => router.push(`/opportunity-form?id=${o.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={s.itemInfo}>
                    <Text style={s.itemTitle} numberOfLines={1}>{o.title}</Text>
                    <Text style={s.itemMeta}>
                      {OPP_LABELS[o.category] ?? o.category}
                      {o.spots_total
                        ? ` · ${o.spots_total - o.spots_filled} / ${o.spots_total} spots left`
                        : ''}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: (STATUS_COLOR[o.status] ?? '#A8A29E') + '22' }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLOR[o.status] ?? '#A8A29E' }]}>
                      {o.status}
                    </Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDelete('opportunities', o.id, o.title, load)}
                >
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* ── Events ── */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Events</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => router.push(`/event-form?orgId=${id}`)}
              >
                <Text style={s.addBtnText}>+ New</Text>
              </TouchableOpacity>
            </View>

            {events.length === 0 ? (
              <Text style={s.empty}>
                No events yet. Create one to invite your community.
              </Text>
            ) : events.map((ev) => (
              <View key={ev.id} style={s.item}>
                <TouchableOpacity
                  style={s.itemMain}
                  onPress={() => router.push(`/event-form?id=${ev.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={s.itemInfo}>
                    <Text style={s.itemTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={s.itemMeta}>
                      {EVT_LABELS[ev.category] ?? ev.category}
                      {ev.is_virtual
                        ? ' · Virtual'
                        : ev.city ? ` · ${[ev.city, ev.state].filter(Boolean).join(', ')}` : ''}
                    </Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDelete('events', ev.id, ev.title, load)}
                >
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E5DDD4',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1C1917' },
  addBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  empty: { fontSize: 13, color: '#A8A29E', lineHeight: 20, textAlign: 'center', paddingVertical: 8 },

  item: {
    borderTopWidth: 1, borderTopColor: '#F5F0E8',
    paddingTop: 10, marginTop: 4,
  },
  itemMain: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#78716C' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  chevron: { fontSize: 20, color: '#C4B9AF' },
  deleteText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
});
