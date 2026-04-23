import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  mental_health: { bg: '#EDE9FE', text: '#5B21B6' },
  crisis:        { bg: '#FEE2E2', text: '#991B1B' },
  housing:       { bg: '#FEF3C7', text: '#92400E' },
  food:          { bg: '#D1FAE5', text: '#065F46' },
  medical:       { bg: '#DBEAFE', text: '#1E40AF' },
  legal:         { bg: '#E0E7FF', text: '#3730A3' },
  financial:     { bg: '#FEF9C3', text: '#713F12' },
  substance:     { bg: '#FFE4E6', text: '#9F1239' },
  spiritual:     { bg: '#D1FAE5', text: '#2D6A4F' },
  community:     { bg: '#F3F4F6', text: '#374151' },
  other:         { bg: '#F3F4F6', text: '#374151' },
};

const CATEGORY_LABELS: Record<string, string> = {
  mental_health: 'Mental Health', crisis: 'Crisis', housing: 'Housing',
  food: 'Food', medical: 'Medical', legal: 'Legal', financial: 'Financial',
  substance: 'Recovery', spiritual: 'Spiritual', community: 'Community', other: 'Other',
};

interface Props {
  resource: any;
  onPress: () => void;
}

export function ResourceCard({ resource: r, onPress }: Props) {
  const color = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.other;
  const location = r.is_national ? 'National' : [r.city, r.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {r.is_crisis && (
        <View style={styles.crisisBanner}>
          <Text style={styles.crisisBannerText}>Crisis Resource</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.chip, { backgroundColor: color.bg }]}>
            <Text style={[styles.chipText, { color: color.text }]}>
              {CATEGORY_LABELS[r.category] ?? r.category}
            </Text>
          </View>
          {location ? <Text style={styles.location}>{location}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{r.title}</Text>
        {r.description ? (
          <Text style={styles.desc} numberOfLines={2}>{r.description}</Text>
        ) : null}
        <View style={styles.footer}>
          {r.organizations?.name && (
            <Text style={styles.org}>{r.organizations.name}</Text>
          )}
          <View style={styles.contactIcons}>
            {r.phone && <View style={styles.contactChip}><Text style={styles.contactChipText}>Call</Text></View>}
            {r.email && <View style={styles.contactChip}><Text style={styles.contactChipText}>Email</Text></View>}
            {r.website_url && <View style={styles.contactChip}><Text style={styles.contactChipText}>Web</Text></View>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  crisisBanner: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  crisisBannerText: { fontSize: 12, fontWeight: '700', color: '#991B1B' },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  location: { fontSize: 12, color: '#888' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  org: { fontSize: 12, color: '#888', flex: 1 },
  contactIcons: { flexDirection: 'row', gap: 6 },
  contactChip: {
    backgroundColor: '#F5F0E8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  contactChipText: { fontSize: 11, fontWeight: '700', color: '#57534E' },
});
