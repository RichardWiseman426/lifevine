import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useResources } from '../../src/hooks/useResources';
import { ResourceCard } from '../../src/components/ResourceCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useIntentStore } from '../../src/store/intent';

const CATEGORIES = [
  { label: 'All',           value: '' },
  { label: 'Mental Health', value: 'mental_health' },
  { label: 'Food',          value: 'food' },
  { label: 'Housing',       value: 'housing' },
  { label: 'Medical',       value: 'medical' },
  { label: 'Recovery',      value: 'substance' },
  { label: 'Financial',     value: 'financial' },
  { label: 'Legal',         value: 'legal' },
  { label: 'Spiritual',     value: 'spiritual' },
  { label: 'Community',     value: 'community' },
];

export default function ResourcesScreen() {
  const { mode } = useIntentStore();
  const [category, setCategory] = useState('');
  const { resources, loading } = useResources(category);

  const heading = mode === 'support' ? 'Support Resources' : 'Resources';
  const sub     = mode === 'support'
    ? 'Counseling, care, and community services.'
    : 'Support services and helpful contacts.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.filterChip, category === c.value && styles.filterChipActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.filterText, category === c.value && styles.filterTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={() => router.push(`/resource/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No resources yet"
              subtitle="Check back soon — resources are being added regularly"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  sub: { fontSize: 14, color: '#888', marginTop: 2 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  filterChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: 4, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
