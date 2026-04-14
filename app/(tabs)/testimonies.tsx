import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTestimonies } from '../../src/hooks/useTestimonies';
import { TestimonyCard } from '../../src/components/TestimonyCard';
import { EmptyState } from '../../src/components/EmptyState';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Healing', value: 'healing' },
  { label: 'Provision', value: 'provision' },
  { label: 'Community', value: 'community' },
  { label: 'Restoration', value: 'restoration' },
  { label: 'Salvation', value: 'salvation' },
];

export default function TestimoniesScreen() {
  const [category, setCategory] = useState('');
  const { testimonies, loading } = useTestimonies(category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Stories</Text>
        <Text style={styles.sub}>Real experiences. Real change.</Text>
      </View>

      {/* Category filter */}
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
          data={testimonies}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TestimonyCard
              testimony={item}
              onPress={() => router.push(`/testimony/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No stories yet"
              subtitle="Be the first to share what God has done"
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
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: 4, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
