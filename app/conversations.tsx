import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useConversations } from '../src/hooks/useConversations';
import { useAuthStore } from '../src/store/auth';
import { EmptyState } from '../src/components/EmptyState';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ConversationsScreen() {
  const { user } = useAuthStore();
  const { conversations, loading, refetch } = useConversations();

  function getOtherName(conv: any): string {
    if (conv.type === 'group' || conv.type === 'context') return conv.title ?? 'Group';
    const others = (conv.conversation_participants ?? []).filter(
      (p: any) => p.user_id !== user?.id
    );
    return others[0]?.profiles?.display_name ?? others[0]?.profiles?.username ?? 'Someone';
  }

  function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversation_id}
        onRefresh={refetch}
        refreshing={loading}
        renderItem={({ item }) => {
          const conv = item.conversations;
          if (!conv) return null;
          const name = getOtherName(conv);
          const initials = getInitials(name);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/conversation/${conv.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{name}</Text>
                  {conv.last_message_at && (
                    <Text style={styles.time}>{formatTime(conv.last_message_at)}</Text>
                  )}
                </View>
                <Text style={styles.convType}>
                  {conv.type === 'direct' ? 'Direct message' : conv.type}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No messages yet"
            subtitle="Start a conversation from an organization or event page"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  back: { marginBottom: 8 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  list: { paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  time: { fontSize: 12, color: '#aaa' },
  convType: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
});
