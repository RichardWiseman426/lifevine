import { useState, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, ScrollView, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTestimonies } from '../../src/hooks/useTestimonies';
import { TestimonyCard } from '../../src/components/TestimonyCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'All',         value: ''            },
  { label: 'Healing',     value: 'healing'     },
  { label: 'Provision',   value: 'provision'   },
  { label: 'Community',   value: 'community'   },
  { label: 'Restoration', value: 'restoration' },
  { label: 'Salvation',   value: 'salvation'   },
];

const CATEGORY_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  healing:     { bg: '#FEF3C7', bar: '#F59E0B', text: '#92400E' },
  provision:   { bg: '#ECFDF5', bar: '#10B981', text: '#065F46' },
  community:   { bg: '#EFF6FF', bar: '#3B82F6', text: '#1E40AF' },
  restoration: { bg: '#FDF2F8', bar: '#EC4899', text: '#9D174D' },
  salvation:   { bg: '#F5F3FF', bar: '#8B5CF6', text: '#5B21B6' },
};

// ── Local carousel card ──────────────────────────────────────────
function LocalCard({ testimony: t }: { testimony: any }) {
  const color = CATEGORY_COLORS[t.category] ?? { bg: '#F5F0E8', bar: '#A8A29E', text: '#78716C' };
  const authorName = t.is_anonymous ? 'Anonymous' : (t.profiles?.display_name ?? 'Someone');

  return (
    <TouchableOpacity
      style={[localCard.card, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/testimony/${t.id}`)}
      activeOpacity={0.85}
    >
      <View style={[localCard.accent, { backgroundColor: color.bar }]} />
      <View style={localCard.body}>
        <View style={localCard.topRow}>
          <View style={[localCard.chip, { backgroundColor: color.bg }]}>
            <Text style={[localCard.chipText, { color: color.text }]}>
              {t.category.charAt(0).toUpperCase() + t.category.slice(1)}
            </Text>
          </View>
          {t.is_featured && (
            <Text style={localCard.featured}>Featured</Text>
          )}
        </View>

        <Text style={localCard.title} numberOfLines={2}>{t.title}</Text>
        <Text style={localCard.excerpt} numberOfLines={3}>{t.body}</Text>

        <View style={localCard.footer}>
          <View style={[localCard.authorDot, { backgroundColor: color.bar }]} />
          <Text style={localCard.author} numberOfLines={1}>
            {authorName}
            {t.organizations?.name ? ` · ${t.organizations.name}` : ''}
          </Text>
        </View>

        <Text style={localCard.cta}>Read the full story →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function TestimoniesScreen() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { testimonies, loading } = useTestimonies(category);
  const { profile } = useAuthStore();

  // Proximity sort: org city match → org state match → everything else
  const { localTestimonies, sortedTestimonies } = useMemo(() => {
    const userCity  = profile?.location_city?.toLowerCase() ?? '';
    const userState = profile?.location_state?.toLowerCase() ?? '';

    const rank = (t: any) => {
      // Check org location first, then fall back to testimony's own city/state
      const tCity  = (t.organizations?.city  ?? t.city)?.toLowerCase()  ?? '';
      const tState = (t.organizations?.state ?? t.state)?.toLowerCase() ?? '';
      if (userCity  && tCity  === userCity)  return 0;
      if (userState && tState === userState) return 1;
      return 2;
    };

    const filtered = search.trim()
      ? testimonies.filter(t =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.body.toLowerCase().includes(search.toLowerCase()) ||
          t.organizations?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : testimonies;

    const sorted = [...filtered].sort((a, b) => rank(a) - rank(b));
    const local  = sorted.filter(t => rank(t) === 0);

    return { localTestimonies: local, sortedTestimonies: sorted };
  }, [testimonies, search, profile?.location_city, profile?.location_state]);

  const cityLabel = profile?.location_city ?? 'your area';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Community" subtitle="Real stories. Real change." />

      {/* ── Category filter chips ── */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(c.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : (
        <FlatList
          data={sortedTestimonies}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={
            <View style={styles.headerSection}>
              {/* Search bar */}
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stories…"
                  placeholderTextColor="#A8A29E"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={styles.submitCta}
                onPress={() => router.push('/submit-testimony')}
                activeOpacity={0.85}
              >
                <View style={styles.submitCtaLeft}>
                  <View>
                    <Text style={styles.submitCtaTitle}>Share Your Story</Text>
                    <Text style={styles.submitCtaSub}>Your experience could encourage someone today.</Text>
                  </View>
                </View>
                <Text style={styles.submitCtaArrow}>›</Text>
              </TouchableOpacity>

              {/* Near You section */}
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionLabel}>NEAR YOU</Text>
                <Text style={styles.sectionSub}>{cityLabel}</Text>
              </View>

              {localTestimonies.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselRow}
                  decelerationRate="fast"
                  snapToInterval={CARD_WIDTH + 12}
                >
                  {localTestimonies.map((t) => (
                    <LocalCard key={t.id} testimony={t} />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.carouselEmpty}>
                  <Text style={styles.carouselEmptyText}>
                    {profile?.location_city
                      ? `No stories from ${profile.location_city} yet.`
                      : 'Add your city in Profile to see local stories.'}
                  </Text>
                </View>
              )}

              {/* All section heading */}
              <View style={styles.allHeadRow}>
                <Text style={styles.sectionLabel}>ALL STORIES</Text>
                <Text style={styles.sectionSub}>Most recent</Text>
              </View>
            </View>
          }

          renderItem={({ item }) => (
            <TestimonyCard
              testimony={item}
              onPress={() => router.push(`/testimony/${item.id}`)}
            />
          )}

          ListEmptyComponent={
            <EmptyState
              title="No stories yet"
              subtitle="Be the first to share your story"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },

  // Filter chips
  filterWrap: { paddingTop: 4, paddingBottom: 2 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  chipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipIcon: { fontSize: 14 },
  chipLabel: { fontSize: 13, color: '#57534E', fontWeight: '600' },
  chipLabelActive: { color: '#FFFFFF', fontWeight: '700' },

  // Header section
  headerSection: { paddingTop: 8, paddingBottom: 4 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1917', paddingVertical: 0 },

  // Submit CTA card
  submitCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2D6A4F', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 20,
    paddingHorizontal: 18, paddingVertical: 16,
    shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  submitCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  submitCtaEmoji: { fontSize: 28 },
  submitCtaTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  submitCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },
  submitCtaArrow: { fontSize: 26, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },

  // Section headings
  sectionHeadRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8,
    paddingHorizontal: 16, marginBottom: 12,
  },
  allHeadRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8,
    paddingHorizontal: 16, marginTop: 24, marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  sectionSub: { fontSize: 12, color: '#C4B9AF', fontWeight: '500' },

  // Carousel
  carouselRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  carouselEmpty: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#E5DDD4',
    padding: 20, alignItems: 'center',
  },
  carouselEmptyText: { fontSize: 13, color: '#A8A29E', textAlign: 'center', lineHeight: 20 },

  list: { paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Local card styles ─────────────────────────────────────────────
const localCard = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  accent: { height: 5 },
  body: { padding: 16 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  chip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  featured: { fontSize: 11, color: '#B8864E', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 6, letterSpacing: -0.2, lineHeight: 22 },
  excerpt: { fontSize: 13, color: '#78716C', lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  authorDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  author: { fontSize: 12, color: '#78716C', fontWeight: '600', flex: 1 },
  cta: { fontSize: 13, color: '#2D6A4F', fontWeight: '700', borderTopWidth: 1, borderTopColor: '#F0EBE4', paddingTop: 12 },
});
