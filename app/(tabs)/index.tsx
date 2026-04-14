import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOrganizations } from '../../src/hooks/useOrganizations';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { OrgCard } from '../../src/components/OrgCard';
import { EmptyState } from '../../src/components/EmptyState';

const CATEGORIES = [
  { label: 'All',       value: '' },
  { label: 'Church',    value: 'church' },
  { label: 'Ministry',  value: 'ministry' },
  { label: 'Support',   value: 'support_group' },
  { label: 'Therapy',   value: 'therapy' },
  { label: 'Medical',   value: 'medical' },
  { label: 'Community', value: 'community' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function FeaturedCard({ org, onPress }: { org: any; onPress: () => void }) {
  const initials = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={featStyles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Color bar */}
      <View style={featStyles.bar} />

      <View style={featStyles.body}>
        {/* Avatar + verified */}
        <View style={featStyles.topRow}>
          <View style={featStyles.avatar}>
            <Text style={featStyles.avatarText}>{initials}</Text>
          </View>
          {org.is_verified && (
            <View style={featStyles.verifiedBadge}>
              <Text style={featStyles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        <Text style={featStyles.name} numberOfLines={2}>{org.name}</Text>
        {org.short_description ? (
          <Text style={featStyles.desc} numberOfLines={2}>{org.short_description}</Text>
        ) : null}

        <View style={featStyles.footer}>
          {location ? <Text style={featStyles.meta}>📍 {location}</Text> : null}
          <Text style={featStyles.cta}>Learn more →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const { profile } = useAuthStore();
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [featured, setFeatured]   = useState<any[]>([]);
  const { orgs, loading } = useOrganizations(search, category);

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, short_description, category, city, state, is_verified')
      .eq('is_featured', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(6)
      .then(({ data }) => setFeatured(data ?? []));
  }, []);

  const firstName = profile?.display_name?.split(' ')[0] ?? null;

  const ListHeader = (
    <View>
      {/* ── Hero ──────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroGreeting}>{greeting()}{firstName ? `, ${firstName}` : ''}.</Text>
        <Text style={styles.heroTagline}>Connect.{'\n'}Serve. Belong.</Text>
        <Text style={styles.heroSub}>
          Discover organizations, events, and ways to make a difference near you.
        </Text>
      </View>

      {/* ── Featured ──────────────────────────── */}
      {featured.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>FEATURED NEAR YOU</Text>
            <View style={styles.featuredPill}>
              <Text style={styles.featuredPillText}>Sponsored</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featured.map((org) => (
              <FeaturedCard
                key={org.id}
                org={org}
                onPress={() => router.push(`/org/${org.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Explore header ────────────────────── */}
      <View style={styles.exploreHeader}>
        <Text style={styles.exploreTitle}>Organizations</Text>
        <Text style={styles.exploreSub}>Find people doing good near you</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchInner}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name…"
            placeholderTextColor="#A8A29E"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Filter chips */}
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading && search === '' && category === '' ? (
        <>
          {ListHeader}
          <View style={styles.centered}>
            <ActivityIndicator color="#2D6A4F" size="large" />
          </View>
        </>
      ) : (
        <FlatList
          data={orgs}
          keyExtractor={(o) => o.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <OrgCard
              org={item}
              onPress={() => router.push(`/org/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No organizations found"
              subtitle="Try a different search or category"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Featured card styles ──────────────────────────────
const featStyles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  bar: {
    height: 4,
    backgroundColor: '#2D6A4F',
    width: '100%',
  },
  body: { padding: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#E2F0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#2D6A4F', fontWeight: '800', fontSize: 15 },
  verifiedBadge: {
    backgroundColor: '#E2F0E8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: { fontSize: 11, color: '#2D6A4F', fontWeight: '700' },
  name: {
    fontSize: 15, fontWeight: '700', color: '#1C1917',
    letterSpacing: -0.2, marginBottom: 5,
  },
  desc: { fontSize: 13, color: '#78716C', lineHeight: 18, marginBottom: 12 },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontSize: 12, color: '#A8A29E' },
  cta: { fontSize: 13, color: '#2D6A4F', fontWeight: '700' },
});

// ── Screen styles ────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { paddingVertical: 48, alignItems: 'center' },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroGreeting: {
    fontSize: 15,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  heroTagline: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 15,
    color: '#78716C',
    lineHeight: 22,
    maxWidth: 300,
  },

  // Featured
  featuredSection: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 1.4,
  },
  featuredPill: {
    backgroundColor: '#FDF3E3',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F0D9B8',
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8864E',
    letterSpacing: 0.3,
  },
  featuredScroll: { paddingLeft: 24, paddingRight: 12 },

  // Explore
  exploreHeader: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  exploreSub: {
    fontSize: 13,
    color: '#A8A29E',
  },

  // Search
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
    padding: 0,
  },

  // Filter
  filterRow: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
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

  // List
  list: { paddingBottom: 40 },
});
