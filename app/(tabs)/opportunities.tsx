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
import { useOpportunities } from '../../src/hooks/useOpportunities';
import { OpportunityCard } from '../../src/components/OpportunityCard';
import { EmptyState } from '../../src/components/EmptyState';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Volunteer', value: 'volunteer' },
  { label: 'Service', value: 'service' },
  { label: 'Community', value: 'community_need' },
  { label: 'Prayer', value: 'prayer' },
  { label: 'Mentorship', value: 'mentorship' },
];

export default function OpportunitiesScreen() {
  const [category, setCategory] = useState('');
  const { opportunities, loading } = useOpportunities(category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Serve</Text>
        <Text style={styles.sub}>Take meaningful action in your community</Text>
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

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OpportunityCard
              opportunity={item}
              onPress={() => router.push(`/opportunity/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No opportunities right now"
              subtitle="Check back soon — organizations post new needs regularly"
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
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: { fontSize: 14, color: '#78716C', lineHeight: 20 },
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
