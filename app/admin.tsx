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

export default function AdminScreen() {
  const { profile } = useAuthStore();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('moderation_queue')
      .select('*')
      .order('created_at', { ascending: true });
    setQueue(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Guard — only super_admin should reach this screen
  if (profile?.platform_role !== 'super_admin') {
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

  async function moderate(item: any, action: 'approved' | 'rejected') {
    const table =
      item.content_type === 'testimony' ? 'testimonies'
      : item.content_type === 'testimony_response' ? 'testimony_responses'
      : 'resources';

    const { error } = await supabase
      .from(table)
      .update({
        status: action,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setQueue((prev) => prev.filter((q) => q.id !== item.id));
    }
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Moderation" />
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pending.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : pending.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.allClearIcon}>✅</Text>
          <Text style={styles.allClear}>All clear!</Text>
          <Text style={styles.allClearSub}>Nothing pending review right now.</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          onRefresh={fetchQueue}
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
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => confirmAction(item, 'rejected')}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => confirmAction(item, 'approved')}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 16, gap: 10,
  },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600', marginRight: 4 },
  heading: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', flex: 1 },
  badge: {
    backgroundColor: '#e53e3e', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.05,
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
