import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Testimony } from '../hooks/useTestimonies';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  healing:      { bg: '#FEF3C7', text: '#92400E' },
  provision:    { bg: '#ECFDF5', text: '#065F46' },
  community:    { bg: '#EFF6FF', text: '#1E40AF' },
  restoration:  { bg: '#FDF2F8', text: '#9D174D' },
  salvation:    { bg: '#F5F3FF', text: '#5B21B6' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface Props {
  testimony: Testimony;
  onPress: () => void;
}

export function TestimonyCard({ testimony: t, onPress }: Props) {
  const color = CATEGORY_COLORS[t.category] ?? { bg: '#F3F4F6', text: '#374151' };
  const authorName = t.is_anonymous ? 'Anonymous' : (t.profiles?.display_name ?? 'Someone');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {t.is_featured && (
        <View style={styles.featuredBanner}>
          <Text style={styles.featuredText}>Featured Story</Text>
        </View>
      )}
      <View style={styles.header}>
        <View style={[styles.chip, { backgroundColor: color.bg }]}>
          <Text style={[styles.chipText, { color: color.text }]}>
            {t.category.charAt(0).toUpperCase() + t.category.slice(1)}
          </Text>
        </View>
        <Text style={styles.time}>{timeAgo(t.created_at)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
      <Text style={styles.body} numberOfLines={3}>{t.body}</Text>
      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <View style={styles.authorDot} />
          <Text style={styles.author}>{authorName}</Text>
          {t.organizations?.name && (
            <Text style={styles.orgName}> · {t.organizations.name}</Text>
          )}
        </View>
        {t.response_count > 0 && (
          <Text style={styles.responses}>
            {t.response_count} {t.response_count === 1 ? 'response' : 'responses'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  featuredText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 12, color: '#aaa' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  body: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D6A4F', marginRight: 6 },
  author: { fontSize: 12, color: '#555', fontWeight: '600' },
  orgName: { fontSize: 12, color: '#888' },
  responses: { fontSize: 12, color: '#888' },
});
