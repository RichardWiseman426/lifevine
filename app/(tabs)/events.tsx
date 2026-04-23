import { useState, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, ScrollView, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUpcomingEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'All',       value: ''          },
  { label: 'Service',   value: 'service'   },
  { label: 'Community', value: 'community' },
  { label: 'Support',   value: 'support'   },
  { label: 'Workshop',  value: 'workshop'  },
  { label: 'Youth',     value: 'youth'     },
];

// ── Local carousel card ──────────────────────────────────────────
function LocalCard({ occ }: { occ: any }) {
  const ev = occ.events;
  if (!ev) return null;

  const d = new Date(occ.starts_at);
  const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const location  = ev.is_virtual ? 'Virtual' : [ev.city, ev.state].filter(Boolean).join(', ');
  const title     = occ.override_title ?? ev.title;

  return (
    <TouchableOpacity
      style={localCard.card}
      onPress={() => router.push(`/event/${ev.id}`)}
      activeOpacity={0.85}
    >
      <View style={localCard.accent} />
      <View style={localCard.body}>
        <View style={localCard.topRow}>
          <View style={localCard.chip}>
            <Text style={localCard.chipText}>{ev.category.replace(/_/g, ' ')}</Text>
          </View>
          {occ.rsvp_count > 0 && (
            <Text style={localCard.rsvps}>{occ.rsvp_count} going</Text>
          )}
        </View>

        <Text style={localCard.dateLine}>{dateLabel} · {timeLabel}</Text>
        <Text style={localCard.title} numberOfLines={2}>{title}</Text>

        {ev.organizations?.name ? (
          <Text style={localCard.org} numberOfLines={1}>{ev.organizations.name}</Text>
        ) : null}

        {location ? (
          <Text style={localCard.location}>{location}</Text>
        ) : null}

        <Text style={localCard.cta}>See event details →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function EventsScreen() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { occurrences, loading } = useUpcomingEvents();
  const { profile } = useAuthStore();

  // Proximity sort: city → state → virtual → other
  const { localOccs, sortedOccs } = useMemo(() => {
    const userCity  = profile?.location_city?.toLowerCase() ?? '';
    const userState = profile?.location_state?.toLowerCase() ?? '';

    const rank = (o: any) => {
      const ev = o.events;
      if (!ev) return 4;
      if (userCity  && ev.city?.toLowerCase()  === userCity)  return 0;
      if (userState && ev.state?.toLowerCase() === userState) return 1;
      if (ev.is_virtual) return 2;
      return 3;
    };

    // Category filter
    const catFiltered = category
      ? occurrences.filter(o => o.events?.category === category)
      : occurrences;

    // Search filter
    const filtered = search.trim()
      ? catFiltered.filter(o => {
          const ev = o.events;
          if (!ev) return false;
          const q = search.toLowerCase();
          return ev.title.toLowerCase().includes(q)
            || ev.short_description?.toLowerCase().includes(q)
            || ev.organizations?.name?.toLowerCase().includes(q);
        })
      : catFiltered;

    const sorted = [...filtered].sort((a, b) => rank(a) - rank(b));
    const local  = sorted.filter(o => rank(o) === 0);

    return { localOccs: local, sortedOccs: sorted };
  }, [occurrences, search, category, profile?.location_city, profile?.location_state]);

  const cityLabel = profile?.location_city ?? 'your area';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Events" subtitle="Upcoming services, gatherings & more" />

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
          data={sortedOccs}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={
            <View style={styles.carouselSection}>
              {/* Search bar */}
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search events…"
                  placeholderTextColor="#A8A29E"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Near You section */}
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionLabel}>NEAR YOU</Text>
                <Text style={styles.sectionSub}>{cityLabel}</Text>
              </View>

              {localOccs.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselRow}
                  decelerationRate="fast"
                  snapToInterval={CARD_WIDTH + 12}
                >
                  {localOccs.map((occ) => (
                    <LocalCard key={occ.id} occ={occ} />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.carouselEmpty}>
                  <Text style={styles.carouselEmptyText}>
                    {profile?.location_city
                      ? `No events in ${profile.location_city} right now.`
                      : 'Add your city in Profile to see local events.'}
                  </Text>
                </View>
              )}

              {/* All section heading */}
              <View style={styles.allHeadRow}>
                <Text style={styles.sectionLabel}>ALL UPCOMING</Text>
                <Text style={styles.sectionSub}>Closest first</Text>
              </View>
            </View>
          }

          renderItem={({ item }) => (
            <EventCard
              occurrence={item}
              onPress={() => router.push(`/event/${item.events?.id}`)}
            />
          )}

          ListEmptyComponent={
            <EmptyState
              title="No upcoming events"
              subtitle="Events from organizations will appear here"
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

  // Filter
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

  // Carousel section
  carouselSection: { paddingTop: 8, paddingBottom: 4 },
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

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    marginHorizontal: 16, marginBottom: 20,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1917', paddingVertical: 0 },

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

// ── Local card styles ────────────────────────────────────────────
const localCard = StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: '#FFFFFF',
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  accent: { height: 5, backgroundColor: '#2D6A4F' },
  body: { padding: 16 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  chip: {
    backgroundColor: '#E2F0E8', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#C6DFD0',
  },
  chipText: { fontSize: 11, color: '#2D6A4F', fontWeight: '700', textTransform: 'capitalize' },
  rsvps: { fontSize: 11, color: '#78716C', fontWeight: '600' },
  dateLine: { fontSize: 12, color: '#78716C', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 5, letterSpacing: -0.2, lineHeight: 22 },
  org: { fontSize: 12, color: '#2D6A4F', fontWeight: '600', marginBottom: 8 },
  location: { fontSize: 12, color: '#A8A29E', marginBottom: 14 },
  cta: { fontSize: 13, color: '#2D6A4F', fontWeight: '700', borderTopWidth: 1, borderTopColor: '#F0EBE4', paddingTop: 12 },
});
