import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrganization } from '../../src/hooks/useOrganizations';

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', support_group: 'Support Group',
  therapy: 'Therapy', medical: 'Medical', nonprofit: 'Nonprofit', community: 'Community',
};

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { org, loading } = useOrganization(id);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (!org) {
    return <View style={styles.centered}><Text>Organization not found.</Text></View>;
  }

  const location = [org.city, org.state, org.country !== 'US' ? org.country : null]
    .filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.heroAvatar}>
          <Text style={styles.heroInitials}>{org.name.slice(0, 2).toUpperCase()}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.name}>{org.name}</Text>
          {org.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>Verified</Text></View>}
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{CATEGORY_LABELS[org.category] ?? org.category}</Text>
          </View>
          {location ? <Text style={styles.location}>📍 {location}</Text> : null}
        </View>

        {/* Description */}
        {org.description ? (
          <View style={styles.section}>
            <Text style={styles.body}>{org.description}</Text>
          </View>
        ) : null}

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {org.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${org.phone}`)}>
              <Text style={styles.contactLink}>📞 {org.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {org.email ? (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${org.email}`)}>
              <Text style={styles.contactLink}>✉️ {org.email}</Text>
            </TouchableOpacity>
          ) : null}
          {org.website_url ? (
            <TouchableOpacity onPress={() => Linking.openURL(org.website_url!)}>
              <Text style={styles.contactLink}>🌐 {org.website_url}</Text>
            </TouchableOpacity>
          ) : null}
          {!org.phone && !org.email && !org.website_url && (
            <Text style={styles.noContact}>No contact info available.</Text>
          )}
        </View>

        {/* Tags */}
        {org.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagRow}>
              {org.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 48 },
  back: { marginBottom: 20 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#2D6A4F',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroInitials: { color: '#fff', fontSize: 28, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  name: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', flex: 1 },
  badge: { backgroundColor: '#2D6A4F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  chip: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600' },
  location: { fontSize: 13, color: '#888' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  contactLink: { fontSize: 15, color: '#2D6A4F', marginBottom: 10 },
  noContact: { fontSize: 14, color: '#aaa' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, color: '#555' },
});
