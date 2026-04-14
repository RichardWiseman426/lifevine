import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Stories</Text>
            <Text style={styles.sub}>Real experiences. Real change.</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/submit-testimony')}
          >
            <Text style={styles.addBtnText}>+ Share</Text>
          </TouchableOpacity>
        </View>
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
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: { fontSize: 14, color: '#78716C', lineHeight: 20 },
  addBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 2,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  filterChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  filterText: { fontSize: 13, color: '#78716C', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: 4, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
