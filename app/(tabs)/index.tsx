import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ScrollView,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOrganizations } from '../../src/hooks/useOrganizations';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { useDrawerStore } from '../../src/store/drawer';
import { OrgCard } from '../../src/components/OrgCard';
import { EmptyState } from '../../src/components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ── Featured Carousel Card ──────────────────────────────────────
function FeaturedCard({ org }: { org: any }) {
  const initials = org.name
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={featStyles.card}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.88}
    >
      {/* Top accent bar */}
      <View style={featStyles.topBar} />

      <View style={featStyles.body}>
        {/* Avatar row */}
        <View style={featStyles.avatarRow}>
          <View style={featStyles.avatar}>
            <Text style={featStyles.avatarText}>{initials}</Text>
          </View>
          <View style={featStyles.badgeRow}>
            <View style={featStyles.featuredBadge}>
              <Text style={featStyles.featuredBadgeText}>Featured</Text>
            </View>
            {org.is_verified && (
              <View style={featStyles.verifiedBadge}>
                <Text style={featStyles.verifiedBadgeText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Name + description */}
        <Text style={featStyles.name}>{org.name}</Text>
        {org.short_description ? (
          <Text style={featStyles.desc} numberOfLines={3}>
            {org.short_description}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={featStyles.footer}>
          {location ? (
            <Text style={featStyles.location}>📍 {location}</Text>
          ) : null}
          <Text style={featStyles.cta}>Explore →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Carousel dots ───────────────────────────────────────────────
function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i === active && dotStyles.dotActive]}
        />
      ))}
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────
export default function ExploreScreen() {
  const { profile } = useAuthStore();
  const { open } = useDrawerStore();
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [featured, setFeatured]     = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { orgs, loading } = useOrganizations(search, category);

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, short_description, category, city, state, is_verified')
      .eq('is_featured', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(8)
      .then(({ data }) => setFeatured(data ?? []));
  }, []);

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setCarouselIndex(Math.round(x / SCREEN_WIDTH));
  }

  const firstName = profile?.display_name?.split(' ')[0] ?? null;

  const ListHeader = (
    <View>
      {/* ── Top bar: greeting + hamburger ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </Text>
          <Text style={styles.topBarSub}>What's happening near you</Text>
        </View>
        <TouchableOpacity
          onPress={open}
          style={styles.hamburgerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.hamLine} />
          <View style={[styles.hamLine, { width: 13 }]} />
          <View style={styles.hamLine} />
        </TouchableOpacity>
      </View>

      {/* ── Featured carousel ── */}
      {featured.length > 0 && (
        <View style={styles.carouselSection}>
          <Text style={styles.carouselLabel}>FEATURED CONTRIBUTORS</Text>
          <FlatList
            data={featured}
            keyExtractor={(o) => o.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH }}>
                <FeaturedCard org={item} />
              </View>
            )}
            scrollEventThrottle={16}
          />
          <CarouselDots count={featured.length} active={carouselIndex} />
        </View>
      )}

      {/* ── Organizations header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Organizations</Text>
        <Text style={styles.sectionSub}>Find people doing good near you</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
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

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading && !search && !category ? (
        <>
          {ListHeader}
          <View style={styles.centered}>
            <ActivityIndicator color="#2E7D32" size="large" />
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

// ── Featured card styles ─────────────────────────────────────────
const featStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5DDD4',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4,
  },
  topBar: { height: 5, backgroundColor: '#2E7D32' },
  body: { padding: 20 },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#2E7D32', fontWeight: '800', fontSize: 18 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  featuredBadge: {
    backgroundColor: '#FDF3E3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0D9B8',
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700', color: '#B8864E' },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#78716C',
    lineHeight: 21,
    marginBottom: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
    paddingTop: 14,
  },
  location: { fontSize: 13, color: '#A8A29E' },
  cta: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },
});

// ── Dot styles ───────────────────────────────────────────────────
const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5DDD4',
  },
  dotActive: {
    backgroundColor: '#2E7D32',
    width: 18,
  },
});

// ── Screen styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { paddingVertical: 48, alignItems: 'center' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 13,
    color: '#A8A29E',
    marginTop: 2,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  hamLine: {
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#1C1917',
  },

  // Carousel
  carouselSection: { marginBottom: 28 },
  carouselLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 1.4,
    paddingHorizontal: 22,
    marginBottom: 14,
  },

  // Organizations section
  sectionHeader: {
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  sectionSub: { fontSize: 13, color: '#A8A29E' },

  // Search
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchRow: {
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
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1917', padding: 0 },

  // Chips
  filterRow: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#78716C', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  list: { paddingBottom: 40 },
});
