import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Organization } from '../hooks/useOrganizations';

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church',
  ministry: 'Ministry',
  support_group: 'Support Group',
  therapy: 'Therapy',
  medical: 'Medical',
  nonprofit: 'Nonprofit',
  community: 'Community',
};

interface Props {
  org: Organization;
  onPress: () => void;
}

export function OrgCard({ org, onPress }: Props) {
  const initials = org.name.slice(0, 2).toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');
  const categoryLabel = CATEGORY_LABELS[org.category] ?? org.category;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{org.name}</Text>
            {org.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{categoryLabel}</Text>
            </View>
            {location ? <Text style={styles.location}>{location}</Text> : null}
          </View>
          {org.short_description ? (
            <Text style={styles.description} numberOfLines={2}>
              {org.short_description}
            </Text>
          ) : null}
        </View>
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  verifiedBadge: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  chipText: { fontSize: 12, color: '#2D6A4F', fontWeight: '600' },
  location: { fontSize: 12, color: '#888' },
  description: { fontSize: 13, color: '#555', lineHeight: 18 },
});
