import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { BackHeader } from '../../src/components/BackHeader';
import { useResource } from '../../src/hooks/useResources';

const CATEGORY_LABELS: Record<string, string> = {
  mental_health: 'Mental Health', crisis: 'Crisis', housing: 'Housing',
  food: 'Food', medical: 'Medical', legal: 'Legal', financial: 'Financial',
  substance: 'Recovery Support', spiritual: 'Spiritual', community: 'Community', other: 'Other',
};

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

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resource: r, loading } = useResource(id);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }
  if (!r) {
    return <View style={styles.centered}><Text>Resource not found.</Text></View>;
  }

  const color = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.other;
  const location = r.is_national ? 'National Resource' : [r.city, r.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Resource" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {r.is_crisis && (
          <View style={styles.crisisBanner}>
            <Text style={styles.crisisBannerText}>🚨 Crisis Resource — Help is available now</Text>
          </View>
        )}

        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: color.bg }]}>
            <Text style={[styles.chipText, { color: color.text }]}>
              {CATEGORY_LABELS[r.category] ?? r.category}
            </Text>
          </View>
          {location ? <Text style={styles.location}>📍 {location}</Text> : null}
        </View>

        <Text style={styles.title}>{r.title}</Text>

        {r.organizations?.name && (
          <TouchableOpacity onPress={() => router.push(`/org/${r.org_id}`)}>
            <Text style={styles.orgLink}>{r.organizations.name} →</Text>
          </TouchableOpacity>
        )}

        {r.description ? (
          <View style={styles.section}>
            <Text style={styles.body}>{r.description}</Text>
          </View>
        ) : null}

        {/* Contact */}
        {(r.phone || r.email || r.website_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help</Text>
            {r.phone ? (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${r.phone}`)}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactLink}>{r.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {r.email ? (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${r.email}`)}>
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactLink}>{r.email}</Text>
              </TouchableOpacity>
            ) : null}
            {r.website_url ? (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(r.website_url)}>
                <Text style={styles.contactIcon}>🌐</Text>
                <Text style={styles.contactLink}>{r.website_url}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Tags */}
        {r.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagRow}>
              {r.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* File download */}
        {r.file_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Download</Text>
            <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(r.file_url)}>
              <Text style={styles.downloadBtnText}>📄 Download Resource</Text>
            </TouchableOpacity>
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
  back: { marginBottom: 16 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  crisisBanner: {
    backgroundColor: '#FEE2E2', borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  crisisBannerText: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 13, fontWeight: '700' },
  location: { fontSize: 13, color: '#888' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  orgLink: { fontSize: 14, color: '#2D6A4F', fontWeight: '600', marginBottom: 14 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactIcon: { fontSize: 18, marginRight: 10 },
  contactLink: { fontSize: 15, color: '#2D6A4F', flex: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, color: '#555' },
  downloadBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  downloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
