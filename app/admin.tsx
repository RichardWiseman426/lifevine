import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BackHeader } from '../src/components/BackHeader';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  testimony: 'Testimony',
  testimony_response: 'Response',
  resource: 'Resource',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', support_group: 'Support Group',
  therapy: 'Counseling', medical: 'Medical', community: 'Community Org',
};

// ── Tab bar ──────────────────────────────────────────────────────
function TabBar({
  active, onChange, counts,
}: {
  active: string;
  onChange: (t: string) => void;
  counts: Record<string, number>;
}) {
  const tabs = [
    { key: 'applications', label: 'Applications' },
    { key: 'moderation',   label: 'Moderation'   },
  ];
  return (
    <View style={tabStyles.bar}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[tabStyles.tab, active === t.key && tabStyles.tabActive]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.75}
        >
          <Text style={[tabStyles.label, active === t.key && tabStyles.labelActive]}>
            {t.label}
          </Text>
          {(counts[t.key] ?? 0) > 0 && (
            <View style={tabStyles.badge}>
              <Text style={tabStyles.badgeText}>{counts[t.key]}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Applications panel ───────────────────────────────────────────
function ApplicationsPanel() {
  const [apps, setApps]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'pending' | 'approved' | 'rejected'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contributor_applications')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: true });
    setApps(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleDecision(app: any, decision: 'approved' | 'rejected') {
    Alert.alert(
      decision === 'approved' ? 'Approve application?' : 'Reject application?',
      `${app.org_name}\n${app.contact_email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: decision === 'approved' ? 'Approve' : 'Reject',
          style: decision === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('contributor_applications')
              .update({ status: decision, reviewed_at: new Date().toISOString() })
              .eq('id', app.id);
            if (error) Alert.alert('Error', error.message);
            else setApps((prev) => prev.filter((a) => a.id !== app.id));
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={appStyles.filterRow}>
        {(['pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[appStyles.filterChip, filter === f && appStyles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[appStyles.filterChipText, filter === f && appStyles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      ) : apps.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.allClearIcon}>📋</Text>
          <Text style={styles.allClear}>No {filter} applications</Text>
          <Text style={styles.allClearSub}>Nothing here right now.</Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(a) => a.id}
          onRefresh={load}
          refreshing={loading}
          contentContainerStyle={styles.list}
          renderItem={({ item: app }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>
                    {ORG_TYPE_LABELS[app.org_type] ?? app.org_type}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(app.created_at)}</Text>
              </View>

              <Text style={appStyles.orgName}>{app.org_name}</Text>
              {app.denomination ? (
                <Text style={appStyles.denom}>{app.denomination}</Text>
              ) : null}
              {(app.city || app.state) ? (
                <Text style={appStyles.location}>
                  📍 {[app.city, app.state].filter(Boolean).join(', ')}
                </Text>
              ) : null}

              <Text style={appStyles.desc} numberOfLines={3}>{app.description}</Text>

              <View style={appStyles.contactBlock}>
                <Text style={appStyles.sectionMeta}>Primary Contact</Text>
                <Text style={appStyles.contactName}>{app.contact_name}</Text>
                <Text style={appStyles.contactDetail}>{app.contact_email}</Text>
                {app.contact_phone ? (
                  <Text style={appStyles.contactDetail}>{app.contact_phone}</Text>
                ) : null}
              </View>

              {app.usage_intent ? (
                <View style={appStyles.intentBlock}>
                  <Text style={appStyles.sectionMeta}>How they plan to use LifeVine</Text>
                  <Text style={appStyles.intentText} numberOfLines={3}>{app.usage_intent}</Text>
                </View>
              ) : null}

              {filter === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleDecision(app, 'rejected')}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleDecision(app, 'approved')}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// ── Moderation panel ─────────────────────────────────────────────
function ModerationPanel() {
  const [queue, setQueue]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('moderation_queue')
      .select('*')
      .order('created_at', { ascending: true });
    setQueue(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moderate(item: any, action: 'approved' | 'rejected') {
    const table =
      item.content_type === 'testimony' ? 'testimonies'
      : item.content_type === 'testimony_response' ? 'testimony_responses'
      : 'resources';
    const { error } = await supabase
      .from(table)
      .update({ status: action, moderated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) Alert.alert('Error', error.message);
    else setQueue((prev) => prev.filter((q) => q.id !== item.id));
  }

  function confirmAction(item: any, action: 'approved' | 'rejected') {
    Alert.alert(
      action === 'approved' ? 'Approve this content?' : 'Reject this content?',
      item.preview,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approved' ? 'Approve' : 'Reject',
          style: action === 'approved' ? 'default' : 'destructive',
          onPress: () => moderate(item, action),
        },
      ]
    );
  }

  const pending = queue.filter((q) => q.status === 'pending_review');

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (pending.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.allClearIcon}>✅</Text>
        <Text style={styles.allClear}>All clear!</Text>
        <Text style={styles.allClearSub}>Nothing pending review right now.</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={pending}
      keyExtractor={(item) => item.id}
      onRefresh={load}
      refreshing={loading}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{TYPE_LABELS[item.content_type] ?? item.content_type}</Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={4}>{item.preview}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmAction(item, 'rejected')}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => confirmAction(item, 'approved')}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

// ── Root ─────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('applications');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCounts() {
      const [{ count: appCount }, { data: modData }] = await Promise.all([
        supabase
          .from('contributor_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('moderation_queue')
          .select('id')
          .eq('status', 'pending_review'),
      ]);
      setCounts({
        applications: appCount ?? 0,
        moderation: (modData ?? []).length,
      });
    }
    loadCounts();
  }, []);

  if (profile?.platform_role !== 'super_admin' && profile?.platform_role !== 'moderator') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.noAccess}>Access restricted.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Admin Dashboard" />
      <TabBar active={activeTab} onChange={setActiveTab} counts={counts} />
      {activeTab === 'applications' ? <ApplicationsPanel /> : <ModerationPanel />}
    </SafeAreaView>
  );
}

// ── Tab styles ───────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 14, marginRight: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2D6A4F' },
  label: { fontSize: 14, fontWeight: '600', color: '#aaa' },
  labelActive: { color: '#2D6A4F' },
  badge: {
    backgroundColor: '#e53e3e', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

// ── Application card styles ──────────────────────────────────────
const appStyles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e8e8e8',
  },
  filterChipActive: { backgroundColor: '#e8f5e9', borderColor: '#2D6A4F' },
  filterChipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  filterChipTextActive: { color: '#2D6A4F' },
  orgName: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  denom: { fontSize: 12, color: '#2D6A4F', fontWeight: '600', marginBottom: 4 },
  location: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  desc: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 12 },
  contactBlock: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 10 },
  intentBlock: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 12 },
  sectionMeta: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  contactName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  contactDetail: { fontSize: 13, color: '#555', marginTop: 2 },
  intentText: { fontSize: 13, color: '#555', lineHeight: 20 },
});

// ── Shared styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeChip: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeChipText: { color: '#2D6A4F', fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#aaa' },
  preview: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e53e3e',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  rejectBtnText: { color: '#e53e3e', fontWeight: '700', fontSize: 14 },
  approveBtn: {
    flex: 1, backgroundColor: '#2D6A4F',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noAccess: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  backLink: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  allClearIcon: { fontSize: 48, marginBottom: 12 },
  allClear: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  allClearSub: { fontSize: 14, color: '#888' },
});
