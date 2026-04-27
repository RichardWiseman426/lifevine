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
          <Text style={styles.meta}>{location}</Text>
        ) : null}
        {o.commitment_description ? (
          <Text style={styles.meta}>{o.commitment_description}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  featuredBanner: {
    backgroundColor: '#FDF3E3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featuredText: { fontSize: 11, color: '#B8864E', fontWeight: '800', letterSpacing: 0.3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chip: {
    backgroundColor: '#E2F0E8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C6DFD0',
  },
  chipText: { fontSize: 12, color: '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' },
  spots: { fontSize: 12, color: '#78716C', fontWeight: '500' },
  spotsCritical: { color: '#B91C1C', fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#1C1917', marginBottom: 4, letterSpacing: -0.2 },
  org: { fontSize: 13, color: '#2D6A4F', fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 13, color: '#78716C', lineHeight: 19, marginBottom: 12 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  meta: { fontSize: 12, color: '#78716C' },
  ctaRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5DDD4',
    paddingTop: 12,
  },
  ctaText: { fontSize: 13, color: '#2D6A4F', fontWeight: '700' },
});
