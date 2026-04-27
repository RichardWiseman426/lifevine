import { useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUpcomingEvents } from '../../src/hooks/useEvents';
import { useOpportunities } from '../../src/hooks/useOpportunities';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

/**
 * Get Involved tab — events (near you carousel) + opportunities by type.
 * Background: #F5F0E8 — consistent with rest of app.
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EVENT_CARD_W  = SCREEN_WIDTH * 0.70;
const OPP_CARD_W    = SCREEN_WIDTH * 0.66;

// Opportunity sections in display order
const OPP_SECTIONS = [
  {
    value:    'volunteer',
    label:    'Volunteer',
    subtitle: 'Hands-on opportunities to serve',
    color:    '#2D6A4F',
  },
  {
    value:    'service',
    label:    'Service',
    subtitle: 'Meet practical community needs',
    color:    '#0284C7',
  },
  {
    value:    'community_need',
    label:    'Community Needs',
    subtitle: 'Help where it matters most',
    color:    '#7C3AED',
  },
  {
    value:    'prayer',
    label:    'Prayer',
    subtitle: 'Stand in the gap for others',
    color:    '#D97706',
  },
  {
    value:    'mentorship',
    label:    'Mentorship',
    subtitle: "Invest in someone's growth",
    color:    '#DC2626',
  },
  {
    value:    'fundraising',
    label:    'Fundraising',
    subtitle: 'Support a cause with a donation',
    color:    '#B8864E',
  },
];

// ── Event carousel card ────────────────────────────────────────────
function EventCard({ occ }: { occ: any }) {
  const ev = occ.events;
  if (!ev) return null;

  const d         = new Date(occ.starts_at);
  const month     = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const day       = d.getDate();
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const location  = ev.is_virtual ? 'Virtual' : [ev.city, ev.state].filter(Boolean).join(', ');
  const title     = occ.override_title ?? ev.title;

  return (
    <TouchableOpacity
      style={[evCard.wrap, { width: EVENT_CARD_W }]}
      onPress={() => router.push(`/event/${ev.id}`)}
      activeOpacity={0.85}
    >
      <View style={evCard.datePillar}>
        <Text style={evCard.month}>{month}</Text>
        <Text style={evCard.day}>{day}</Text>
      </View>
      <View style={evCard.body}>
        <View style={evCard.topRow}>
          <View style={evCard.catChip}>
            <Text style={evCard.catText}>
              {ev.category?.replace(/_/g, ' ') ?? 'Event'}
            </Text>
          </View>
          {occ.rsvp_count > 0 && (
            <Text style={evCard.rsvpCount}>{occ.rsvp_count} going</Text>
          )}
        </View>
        <Text style={evCard.title} numberOfLines={2}>{title}</Text>
        {ev.organizations?.name ? (
          <Text style={evCard.org} numberOfLines={1}>{ev.organizations.name}</Text>
        ) : null}
        <View style={evCard.footer}>
          <Text style={evCard.time}>{timeLabel}</Text>
          {location ? <Text style={evCard.loc}> · {location}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Opportunity carousel card ──────────────────────────────────────
function OppCard({ opp, accentColor }: { opp: any; accentColor: string }) {
  const spotsLeft = opp.spots_total != null
    ? opp.spots_total - opp.spots_filled
    : null;
  const location = opp.is_remote
    ? 'Remote'
    : [opp.city, opp.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={[oppCard.wrap, { width: OPP_CARD_W, borderTopColor: accentColor }]}
      onPress={() => router.push(`/opportunity/${opp.id}`)}
      activeOpacity={0.85}
    >
      <View style={oppCard.body}>
        <View style={oppCard.topRow}>
          {opp.is_featured && (
            <View style={oppCard.featuredBadge}>
              <Text style={oppCard.featuredText}>Featured</Text>
            </View>
          )}
          {spotsLeft != null && (
            <Text style={[oppCard.spots, spotsLeft <= 3 && oppCard.spotsUrgent]}>
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}
            </Text>
          )}
        </View>
        <Text style={oppCard.title} numberOfLines={2}>{opp.title}</Text>
        {opp.organizations?.name ? (
          <Text style={oppCard.org} numberOfLines={1}>{opp.organizations.name}</Text>
        ) : null}
        {location ? (
          <Text style={oppCard.location}>{location}</Text>
        ) : null}
        <Text style={[oppCard.cta, { color: accentColor }]}>See how to help →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Reusable section wrapper ───────────────────────────────────────
function Section({
  title, subtitle, color, children, onSearchMore,
}: {
  title: string;
  subtitle?: string;
  color: string;
  children: React.ReactNode;
  onSearchMore?: () => void;
}) {
  return (
    <View style={section.wrap}>
      <View style={section.head}>
        <View style={[section.accentBar, { backgroundColor: color }]} />
        <View style={section.headText}>
          <Text style={section.title}>{title}</Text>
          {subtitle ? <Text style={section.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
      {onSearchMore && (
        <TouchableOpacity
          style={section.searchMoreBtn}
          onPress={onSearchMore}
          activeOpacity={0.7}
        >
          <Text style={[section.searchMoreText, { color }]}>
            Search more {title.toLowerCase()} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function GetInvolvedScreen() {
  const { occurrences, loading: evLoading } = useUpcomingEvents();
  const { opportunities, loading: oppLoading } = useOpportunities('');
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  // Proximity rank helpers
  const eventRank = (o: any) => {
    const ev = o.events;
    if (!ev) return 4;
    if (userCity  && ev.city?.toLowerCase()  === userCity)  return 0;
    if (userState && ev.state?.toLowerCase() === userState) return 1;
    if (ev.is_virtual) return 2;
    return 3;
  };

  const oppRank = (o: any) => {
    if (userCity  && o.city?.toLowerCase()  === userCity)  return 0;
    if (userState && o.state?.toLowerCase() === userState) return 1;
    if (o.is_remote) return 2;
    return 3;
  };

  // State-level distance filter — only show local content.
  // Virtual events and remote opps are always included.
  // Items with no state set are included (assumed national/unspecified).
  // If user has no state, show everything.
  const stateFilteredEvents = useMemo(() => {
    if (!userState) return occurrences;
    return occurrences.filter(o => {
      const ev = o.events;
      if (!ev) return false;
      if (ev.is_virtual) return true;
      if (!ev.state)    return true;
      return ev.state.toLowerCase() === userState;
    });
  }, [occurrences, userState]);

  const stateFilteredOpps = useMemo(() => {
    if (!userState) return opportunities;
    return opportunities.filter(o => {
      if (o.is_remote) return true;
      if (!o.state)    return true;
      return o.state.toLowerCase() === userState;
    });
  }, [opportunities, userState]);

  // Sort events: partner orgs first → nearest → virtual → rest
  const sortedEvents = useMemo(() => {
    return [...stateFilteredEvents]
      .sort((a, b) => {
        const aP = (a.events?.organizations as any)?.is_partner ?? false;
        const bP = (b.events?.organizations as any)?.is_partner ?? false;
        if (aP !== bP) return bP ? 1 : -1;
        return eventRank(a) - eventRank(b);
      })
      .slice(0, 10);
  }, [stateFilteredEvents, userCity, userState]);

  // Partition opportunities by section: partner orgs first → proximity
  const oppsBySection = useMemo(() => {
    return OPP_SECTIONS.reduce<Record<string, any[]>>((acc, sec) => {
      acc[sec.value] = [...stateFilteredOpps]
        .filter(o => o.category === sec.value)
        .sort((a, b) => {
          const aP = (a.organizations as any)?.is_partner ?? false;
          const bP = (b.organizations as any)?.is_partner ?? false;
          if (aP !== bP) return bP ? 1 : -1;
          return oppRank(a) - oppRank(b);
        });
      return acc;
    }, {});
  }, [stateFilteredOpps, userCity, userState]);

  const loading = evLoading || oppLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Get Involved"
        subtitle="Events & ways to make a difference"
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* ── Upcoming Events ── */}
          <Section
            title="Upcoming Events"
            subtitle={profile?.location_city ? `Near ${profile.location_city} first` : 'Nearest first'}
            color="#1A3A2A"
            onSearchMore={() => router.push('/browse-events' as any)}
          >
            {sortedEvents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselRow}
                decelerationRate="fast"
                snapToInterval={EVENT_CARD_W + 12}
              >
                {sortedEvents.map(occ => (
                  <EventCard key={occ.id} occ={occ} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  {profile?.location_city
                    ? `No upcoming events near ${profile.location_city}.`
                    : 'No upcoming events right now.'}
                </Text>
              </View>
            )}
          </Section>

          <View style={styles.divider} />

          {/* ── Opportunity sections ── */}
          {OPP_SECTIONS.map((sec, idx) => {
            const items = oppsBySection[sec.value] ?? [];
            if (items.length === 0) return null;

            return (
              <View key={sec.value}>
                <Section
                  title={sec.label}
                  subtitle={sec.subtitle}
                  color={sec.color}
                  onSearchMore={() =>
                    router.push(`/browse-opportunities?category=${sec.value}` as any)
                  }
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselRow}
                    decelerationRate="fast"
                    snapToInterval={OPP_CARD_W + 12}
                  >
                    {items.map(opp => (
                      <OppCard key={opp.id} opp={opp} accentColor={sec.color} />
                    ))}
                  </ScrollView>
                </Section>
                {idx < OPP_SECTIONS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}

          {/* All opportunity sections empty */}
          {OPP_SECTIONS.every(s => (oppsBySection[s.value] ?? []).length === 0) && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                No open opportunities right now. Check back soon.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F5F0E8' },
  content: { paddingTop: 8 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  carouselRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },

  divider: {
    height: 1, backgroundColor: '#E5DDD4',
    marginHorizontal: 16, marginVertical: 8,
  },

  emptyCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5DDD4',
    padding: 18, alignItems: 'center', marginBottom: 4,
  },
  emptyCardText: { fontSize: 13, color: '#A8A29E', textAlign: 'center', lineHeight: 20 },
});

// ── Section wrapper styles ────────────────────────────────────────
const section = StyleSheet.create({
  wrap: { paddingTop: 16, paddingBottom: 8 },
  head: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  accentBar: { width: 4, borderRadius: 2, marginTop: 3, height: 36 },
  headText:  { flex: 1 },
  title:    { fontSize: 17, fontWeight: '800', color: '#1C1917', letterSpacing: -0.3, lineHeight: 22 },
  subtitle: { fontSize: 12, color: '#78716C', marginTop: 2 },

  searchMoreBtn: {
    marginHorizontal: 16, marginTop: 10, paddingVertical: 4,
  },
  searchMoreText: { fontSize: 13, fontWeight: '700' },
});

// ── Event card styles ─────────────────────────────────────────────
const evCard = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  datePillar: {
    width: 56, backgroundColor: '#1A3A2A',
    alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
  },
  month: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  day:   { fontSize: 26, fontWeight: '900', color: '#FFFFFF', lineHeight: 30 },
  body:  { flex: 1, padding: 14 },
  topRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catChip: {
    backgroundColor: '#E2F0E8', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  catText:  { fontSize: 11, color: '#2D6A4F', fontWeight: '700', textTransform: 'capitalize' },
  rsvpCount:{ fontSize: 11, color: '#78716C' },
  title: { fontSize: 14, fontWeight: '800', color: '#1C1917', marginBottom: 4, lineHeight: 19, letterSpacing: -0.2 },
  org:   { fontSize: 11, color: '#2D6A4F', fontWeight: '600', marginBottom: 6 },
  footer:{ flexDirection: 'row' },
  time:  { fontSize: 11, color: '#78716C', fontWeight: '600' },
  loc:   { fontSize: 11, color: '#A8A29E' },
});

// ── Opportunity card styles ───────────────────────────────────────
const oppCard = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5DDD4',
    borderTopWidth: 4,
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  body: { padding: 14 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8, minHeight: 20,
  },
  featuredBadge: {
    backgroundColor: '#FDF3E3', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  featuredText: { fontSize: 10, color: '#B8864E', fontWeight: '800', letterSpacing: 0.3 },
  spots:        { fontSize: 11, color: '#78716C', fontWeight: '500' },
  spotsUrgent:  { color: '#B91C1C', fontWeight: '700' },
  title:        { fontSize: 14, fontWeight: '800', color: '#1C1917', marginBottom: 4, lineHeight: 19, letterSpacing: -0.2 },
  org:          { fontSize: 11, color: '#2D6A4F', fontWeight: '600', marginBottom: 4 },
  location:     { fontSize: 11, color: '#A8A29E', marginBottom: 12 },
  cta:          { fontSize: 12, fontWeight: '700', borderTopWidth: 1, borderTopColor: '#E5DDD4', paddingTop: 10 },
});
