import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Testimony } from '../hooks/useTestimonies';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  healing:      { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' },
  provision:    { bg: '#ECFDF5', text: '#065F46', bar: '#10B981' },
  community:    { bg: '#EFF6FF', text: '#1E40AF', bar: '#3B82F6' },
  restoration:  { bg: '#FDF2F8', text: '#9D174D', bar: '#EC4899' },
  salvation:    { bg: '#F5F3FF', text: '#5B21B6', bar: '#8B5CF6' },
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
  const color = CATEGORY_COLORS[t.category] ?? { bg: '#F5F0E8', text: '#78716C', bar: '#A8A29E' };
  const authorName = t.is_anonymous ? 'Anonymous' : (t.profiles?.display_name ?? 'Someone');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color.bar }]} />

      <View style={styles.inner}>
        {t.is_featured && (
          <View style={styles.featuredBanner}>
            <Text style={styles.featuredText}>Featured Story</Text>
          </View>
        )}
        <View style={styles.header}>
          <View style={[styles.chip, { backgroundColor: color.bg, borderColor: color.bar + '44' }]}>
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
            <View style={[styles.authorDot, { backgroundColor: color.bar }]} />
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  accentBar: {
    width: 3,
    borderRadius: 3,
    margin: 14,
    marginRight: 0,
    flexShrink: 0,
  },
  inner: {
    flex: 1,
    padding: 18,
    paddingLeft: 14,
  },
  featuredBanner: {
    backgroundColor: '#FDF3E3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0D9BC',
  },
  featuredText: { fontSize: 11, color: '#B8864E', fontWeight: '700', letterSpacing: 0.3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 12, color: '#A8A29E' },
  title: { fontSize: 16, fontWeight: '700', color: '#1C1917', marginBottom: 8, letterSpacing: -0.2 },
  body: { fontSize: 13, color: '#78716C', lineHeight: 20, marginBottom: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  author: { fontSize: 12, color: '#78716C', fontWeight: '600' },
  orgName: { fontSize: 12, color: '#A8A29E' },
  responses: { fontSize: 12, color: '#A8A29E' },
});
