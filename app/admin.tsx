import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, Pressable,
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
    { key: 'requests',     label: 'Requests'      },
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

// ── Full application detail modal ────────────────────────────────
function AppDetailModal({
  app,
  visible,
  onClose,
  onDecision,
}: {
  app: any | null;
  visible: boolean;
  onClose: () => void;
  onDecision?: (app: any, decision: 'approved' | 'rejected') => void;
}) {
  if (!app) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modal.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={modal.header}>
          <Text style={modal.headerTitle}>Application Detail</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn} hitSlop={10}>
            <Text style={modal.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modal.body} showsVerticalScrollIndicator={false}>
          {/* Status pill */}
          <View style={[modal.statusPill, modal[`status_${app.status}` as keyof typeof modal] as any]}>
            <Text style={modal.statusText}>{app.status?.toUpperCase()}</Text>
          </View>

          {/* Org type + date */}
          <View style={modal.metaRow}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{ORG_TYPE_LABELS[app.org_type] ?? app.org_type}</Text>
            </View>
            <Text style={modal.date}>Applied {formatDate(app.created_at)}</Text>
          </View>

          {/* Org name */}
          <Text style={modal.orgName}>{app.org_name}</Text>
          {app.denomination ? <Text style={modal.denom}>{app.denomination}</Text> : null}

          {/* Location */}
          {(app.city || app.state) ? (
            <Text style={modal.location}>
              📍 {[app.city, app.state].filter(Boolean).join(', ')}
            </Text>
          ) : null}

          {/* Website */}
          {app.website_url ? (
            <Text style={modal.website}>🌐 {app.website_url}</Text>
          ) : null}

          {/* Description */}
          <View style={modal.section}>
            <Text style={modal.sectionLabel}>ABOUT THIS ORGANIZATION</Text>
            <Text style={modal.sectionBody}>{app.description ?? '—'}</Text>
          </View>

          {/* Usage intent */}
          {app.usage_intent ? (
            <View style={modal.section}>
              <Text style={modal.sectionLabel}>HOW THEY PLAN TO USE LIFEVINE</Text>
              <Text style={modal.sectionBody}>{app.usage_intent}</Text>
            </View>
          ) : null}

          {/* Contact */}
          <View style={[modal.section, modal.contactBox]}>
            <Text style={modal.sectionLabel}>PRIMARY CONTACT</Text>
            <Text style={modal.contactName}>{app.contact_name}</Text>
            <Text style={modal.contactDetail}>{app.contact_email}</Text>
            {app.contact_phone ? (
              <Text style={modal.contactDetail}>{app.contact_phone}</Text>
            ) : null}
          </View>

          {/* Review info if already decided */}
          {app.reviewed_at ? (
            <Text style={modal.reviewed}>Reviewed {formatDate(app.reviewed_at)}</Text>
          ) : null}
        </ScrollView>

        {/* Action buttons — only for pending */}
        {app.status === 'pending' && onDecision && (
          <View style={modal.footer}>
            <TouchableOpacity
              style={modal.rejectBtn}
              onPress={() => { onClose(); setTimeout(() => onDecision(app, 'rejected'), 300); }}
            >
              <Text style={modal.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modal.approveBtn}
              onPress={() => { onClose(); setTimeout(() => onDecision(app, 'approved'), 300); }}
            >
              <Text style={modal.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Applications panel ───────────────────────────────────────────
function ApplicationsPanel() {
  const [apps, setApps]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selected, setSelected]   = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  function openDetail(app: any) {
    setSelected(app);
    setModalOpen(true);
  }

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
      {/* Filter chips */}
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
            <TouchableOpacity
              style={styles.card}
              onPress={() => openDetail(app)}
              activeOpacity={0.75}
            >
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

              {/* Description — 2 lines only; tap card for full */}
              <Text style={appStyles.desc} numberOfLines={2}>{app.description}</Text>

              <View style={appStyles.tapHint}>
                <Text style={appStyles.tapHintText}>Tap to view full application →</Text>
              </View>

              {filter === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={(e) => { e.stopPropagation?.(); handleDecision(app, 'rejected'); }}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={(e) => { e.stopPropagation?.(); handleDecision(app, 'approved'); }}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <AppDetailModal
        app={selected}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onDecision={filter === 'pending' ? handleDecision : undefined}
      />
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

// ── Community Requests panel ─────────────────────────────────────
type RequestRow = {
  city: string;
  state: string;
  count: number;
  latest: string;
  outreached: boolean;
  ids: string[];
};

function CommunityRequestsPanel() {
  const [rows, setRows]       = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile }           = useAuthStore();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('community_requests')
      .select('id, city, state, created_at, outreached_at')
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    // Group by city + state
    const map = new Map<string, RequestRow>();
    for (const r of (data ?? [])) {
      const key = `${r.city.toLowerCase()}|${r.state.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          city: r.city,
          state: r.state,
          count: 0,
          latest: r.created_at,
          outreached: !!r.outreached_at,
          ids: [],
        });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      entry.ids.push(r.id);
      // outreached only if ALL requests in that city are outreached
      if (!r.outreached_at) entry.outreached = false;
      if (r.created_at > entry.latest) entry.latest = r.created_at;
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      // Un-outreached first, then by count desc
      if (a.outreached !== b.outreached) return a.outreached ? 1 : -1;
      return b.count - a.count;
    });

    setRows(sorted);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markOutreached(row: RequestRow) {
    Alert.alert(
      'Mark as Outreached?',
      `${row.city}, ${row.state} — ${row.count} request${row.count !== 1 ? 's' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Outreached',
          onPress: async () => {
            const now = new Date().toISOString();
            const { error } = await (supabase as any)
              .from('community_requests')
              .update({ outreached_at: now, outreached_by: profile?.id })
              .in('id', row.ids);
            if (error) Alert.alert('Error', error.message);
            else load();
          },
        },
      ]
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }

  if (rows.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.allClearIcon}>📍</Text>
        <Text style={styles.allClear}>No requests yet</Text>
        <Text style={styles.allClearSub}>
          When users request support for their city, it will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => `${r.city}|${r.state}`}
      onRefresh={load}
      refreshing={loading}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={reqStyles.total}>
          {rows.length} location{rows.length !== 1 ? 's' : ''} · {rows.reduce((s, r) => s + r.count, 0)} total requests
        </Text>
      }
      renderItem={({ item: row }) => (
        <View style={[styles.card, row.outreached && reqStyles.cardDone]}>
          <View style={reqStyles.cardTop}>
            <View style={reqStyles.locationWrap}>
              <Text style={reqStyles.location}>{row.city}, {row.state}</Text>
              <Text style={reqStyles.latest}>Last: {formatDate(row.latest)}</Text>
            </View>
            <View style={reqStyles.countBadge}>
              <Text style={reqStyles.countText}>{row.count}</Text>
              <Text style={reqStyles.countSub}>req{row.count !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {row.outreached ? (
            <View style={reqStyles.outreachedPill}>
              <Text style={reqStyles.outreachedText}>✓ Outreached</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={reqStyles.outreachBtn}
              onPress={() => markOutreached(row)}
              activeOpacity={0.75}
            >
              <Text style={reqStyles.outreachBtnText}>Mark as Outreached</Text>
            </TouchableOpacity>
          )}
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
      const [{ count: appCount }, { data: modData }, { data: reqData }] = await Promise.all([
        supabase
          .from('contributor_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('moderation_queue')
          .select('id')
          .eq('status', 'pending_review'),
        (supabase as any)
          .from('community_requests')
          .select('id')
          .is('outreached_at', null),
      ]);
      setCounts({
        applications: appCount ?? 0,
        moderation: (modData ?? []).length,
        requests: (reqData ?? []).length,
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
      {activeTab === 'applications' && <ApplicationsPanel />}
      {activeTab === 'moderation'   && <ModerationPanel />}
      {activeTab === 'requests'     && <CommunityRequestsPanel />}
    </SafeAreaView>
  );
}

// ── Tab styles ───────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2D6A4F' },
  label: { fontSize: 13, fontWeight: '600', color: '#aaa' },
  labelActive: { color: '#2D6A4F' },
  badge: {
    backgroundColor: '#e53e3e', borderRadius: 10,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 17, alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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
  location: { fontSize: 12, color: '#aaa', marginBottom: 8 },
  desc: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 8 },
  tapHint: { marginBottom: 10 },
  tapHintText: { fontSize: 12, color: '#2D6A4F', fontWeight: '600' },
});

// ── Community Requests styles ────────────────────────────────────
const reqStyles = StyleSheet.create({
  total: { fontSize: 12, color: '#aaa', fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  cardDone: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  locationWrap: { flex: 1 },
  location: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  latest: { fontSize: 12, color: '#aaa' },
  countBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', minWidth: 52,
  },
  countText: { fontSize: 20, fontWeight: '900', color: '#2D6A4F', lineHeight: 24 },
  countSub: { fontSize: 10, color: '#2D6A4F', fontWeight: '600' },
  outreachBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  outreachBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outreachedPill: {
    backgroundColor: '#e8f5e9', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  outreachedText: { color: '#2D6A4F', fontWeight: '700', fontSize: 13 },
});

// ── Modal styles ─────────────────────────────────────────────────
const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 18, color: '#888', fontWeight: '600' },
  body: { padding: 20, paddingBottom: 40 },
  statusPill: {
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 14,
  },
  status_pending: { backgroundColor: '#FEF3C7' },
  status_approved: { backgroundColor: '#D1FAE5' },
  status_rejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  date: { fontSize: 12, color: '#aaa' },
  orgName: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginBottom: 4, letterSpacing: -0.3 },
  denom: { fontSize: 13, color: '#2D6A4F', fontWeight: '700', marginBottom: 6 },
  location: { fontSize: 13, color: '#888', marginBottom: 6 },
  website: { fontSize: 13, color: '#2D6A4F', marginBottom: 16 },
  section: { marginBottom: 20 },
  contactBox: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  sectionBody: { fontSize: 14, color: '#333', lineHeight: 22 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  contactDetail: { fontSize: 14, color: '#555', marginBottom: 2 },
  reviewed: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 8 },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  rejectBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e53e3e',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  rejectText: { color: '#e53e3e', fontWeight: '700', fontSize: 15 },
  approveBtn: {
    flex: 1, backgroundColor: '#2D6A4F',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
  allClearSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});
