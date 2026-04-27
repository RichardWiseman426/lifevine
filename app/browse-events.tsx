import { useMemo } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  Text, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUpcomingEvents } from '../src/hooks/useEvents';
import { BackHeader } from '../src/components/BackHeader';
import { EmptyState } from '../src/components/EmptyState';
import { useAuthStore } from '../src/store/auth';

/**
 * Full upcoming-event list — opened from "Search more events" on Get Involved.
 * Filters to user's state (virtual always included).
 * Sort: partner-org → city → state → virtual → chronological.
 */

// ── Event row card ─────────────────────────────────────────────────
function EventListCard({ occ }: { occ: any }) {
  const ev = occ.events;
  if (!ev) return null;

  const d         = new Date(occ.starts_at);
  const month     = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const day       = d.getDate();
  const weekday   = d.toLocaleDateString(undefined, { weekday: 'short' });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const location  = ev.is_virtual ? 'Virtual' : [ev.city, ev.state].filter(Boolean).join(', ');
  const title     = occ.override_title ?? ev.title;
  const isPartner = (ev.organizations as any)?.is_partner ?? false;

  return (
    <TouchableOpacity
      style={card.wrap}
      onPress={() => router.push(`/event/${ev.id}`)}
      activeOpacity={0.75}
    >
      {/* Date pillar */}
      <View style={card.datePillar}>
        <Text style={card.month}>{month}</Text>
        <Text style={card.day}>{day}</Text>
        <Text style={card.weekday}>{weekday}</Text>
      </View>

      {/* Main info */}
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.title} numberOfLines={2}>{title}</Text>
          {isPartner && (
            <View style={card.partnerBadge}>
              <Text style={card.partnerText}>★ Partner</Text>
            </View>
          )}
        </View>

        {ev.organizations?.name ? (
          <Text style={card.org} numberOfLines={1}>{ev.organizations.name}</Text>
        ) : null}

        <View style={card.metaRow}>
          {ev.category ? (
            <View style={card.catChip}>
              <Text style={card.catText}>{ev.category.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          <Text style={card.time}>{timeLabel}</Text>
          {location ? <Text style={card.loc}> · {location}</Text> : null}
        </View>

        {occ.rsvp_count > 0 && (
          <Text style={card.rsvp}>{occ.rsvp_count} going</Text>
        )}
      </View>

      <Text style={card.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function BrowseEventsScreen() {
  const { occurrences, loading } = useUpcomingEvents();
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  const sorted = useMemo(() => {
    // 1. State-level distance filter
    const filtered = !userState
      ? occurrences
      : occurrences.filter(o => {
          const ev = o.events;
          if (!ev) return false;
          if (ev.is_virtual) return true;
          if (!ev.state)    return true;
          return ev.state.toLowerCase() === userState;
        });

    // 2. Sort: partner-org → city → state → virtual → starts_at
    return [...filtered].sort((a, b) => {
      const aP = (a.events?.organizations as any)?.is_partner ?? false;
      const bP = (b.events?.organizations as any)?.is_partner ?? false;
      if (aP !== bP) return bP ? 1 : -1;

      const aCity  = userCity  && a.events?.city?.toLowerCase()  === userCity  ? 0 : 1;
      const bCity  = userCity  && b.events?.city?.toLowerCase()  === userCity  ? 0 : 1;
      if (aCity !== bCity) return aCity - bCity;

      const aState = userState && a.events?.state?.toLowerCase() === userState ? 0 : 1;
      const bState = userState && b.events?.state?.toLowerCase() === userState ? 0 : 1;
      if (aState !== bState) return aState - bState;

      if (a.events?.is_virtual !== b.events?.is_virtual) {
        return a.events?.is_virtual ? -1 : 1;
      }

      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  }, [occurrences, userCity, userState]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Upcoming Events" />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHead}>
              <Text style={styles.subtitle}>Events happening near you</Text>
              <Text style={styles.sortNote}>
                {profile?.location_city
                  ? `Showing results near ${profile.location_city} · Partners first`
                  : 'Add your city in Profile to see local events first'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <EventListCard occ={item} />}
          ListEmptyComponent={
            <EmptyState
              title="No upcoming events"
              subtitle="Check back soon or update your location in Profile"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F5F0E8' },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:    { paddingBottom: 48 },
  listHead:{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  subtitle:{ fontSize: 15, color: '#1C1917', fontWeight: '600', marginBottom: 4 },
  sortNote:{ fontSize: 12, color: '#A8A29E' },
});

// ── Card styles ────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    overflow: 'hidden',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  datePillar: {
    width: 56, backgroundColor: '#1A3A2A',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, alignSelf: 'stretch',
  },
  month:   { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2 },
  day:     { fontSize: 24, fontWeight: '900', color: '#FFFFFF', lineHeight: 28 },
  weekday: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  info:    { flex: 1, padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  title:   { flex: 1, fontSize: 14, fontWeight: '700', color: '#1C1917', lineHeight: 19, letterSpacing: -0.2 },
  partnerBadge: {
    backgroundColor: '#1A3A2A', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start',
  },
  partnerText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  org:     { fontSize: 11, color: '#2D6A4F', fontWeight: '600', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  catChip: {
    backgroundColor: '#E2F0E8', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  catText: { fontSize: 10, color: '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' },
  time:    { fontSize: 11, color: '#78716C', fontWeight: '600' },
  loc:     { fontSize: 11, color: '#A8A29E' },
  rsvp:    { fontSize: 11, color: '#78716C', marginTop: 4 },
  chevron: { fontSize: 20, color: '#C4B9AF', marginRight: 12 },
});
