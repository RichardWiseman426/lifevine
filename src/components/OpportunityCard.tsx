import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Opportunity } from '../hooks/useOpportunities';

interface Props {
  opportunity: Opportunity;
  onPress: () => void;
}

export function OpportunityCard({ opportunity: o, onPress }: Props) {
  const spotsLeft = o.spots_total != null ? o.spots_total - o.spots_filled : null;
  const location = o.is_remote ? 'Remote' : [o.city, o.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {o.is_featured && (
        <View style={styles.featuredBanner}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{o.category.replace(/_/g, ' ')}</Text>
        </View>
        {spotsLeft != null && (
          <Text style={[styles.spots, spotsLeft <= 3 && styles.spotsCritical]}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </Text>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{o.title}</Text>
      {o.organizations?.name && (
        <Text style={styles.org}>{o.organizations.name}</Text>
      )}
      {o.short_description && (
        <Text style={styles.description} numberOfLines={2}>{o.short_description}</Text>
      )}
      <View style={styles.footer}>
        {location ? (
          <Text style={styles.meta}>{o.is_remote ? '🌐' : '📍'} {location}</Text>
        ) : null}
        {o.commitment_description ? (
          <Text style={styles.meta}>⏱ {o.commitment_description}</Text>
        ) : null}
      </View>
      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>See how to help →</Text>
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
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, color: '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' },
  spots: { fontSize: 12, color: '#888', fontWeight: '500' },
  spotsCritical: { color: '#e53e3e', fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  org: { fontSize: 13, color: '#2D6A4F', fontWeight: '600', marginBottom: 6 },
  description: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  meta: { fontSize: 12, color: '#888' },
  ctaRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  ctaText: { fontSize: 13, color: '#2D6A4F', fontWeight: '700' },
});
