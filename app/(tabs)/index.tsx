import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { useDrawerStore } from '../../src/store/drawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Daily affirmations (rotates by day-of-year) ─────────────────
const AFFIRMATIONS = [
  { text: 'You are not alone. Community is closer than you think.', ref: undefined },
  { text: 'You were made for more than you can see right now.', ref: 'Jeremiah 29:11' },
  { text: 'Every act of kindness creates a ripple without end.', ref: undefined },
  { text: 'Rest is not weakness. It is wisdom.', ref: undefined },
  { text: 'You are seen. You are known. You matter.', ref: 'Romans 8:38' },
  { text: 'Small steps forward are still forward.', ref: undefined },
  { text: 'Healing is not linear — and that\'s okay.', ref: undefined },
  { text: 'Where two or three gather, something real happens.', ref: 'Matthew 18:20' },
  { text: 'Your story is not over. Not even close.', ref: undefined },
  { text: 'Love your neighbor — it starts with showing up.', ref: 'Mark 12:31' },
  { text: 'You don\'t have to have it all together to reach out.', ref: undefined },
  { text: 'Strength is asking for help when you need it.', ref: undefined },
  { text: 'There is always someone whose life is better because you exist.', ref: undefined },
  { text: 'Grace means starting again, as many times as it takes.', ref: undefined },
  { text: 'Real community shows up in the hard moments.', ref: undefined },
  { text: 'You carry more light than you realize.', ref: undefined },
  { text: 'Be the person you needed when you were younger.', ref: undefined },
  { text: 'Patience with yourself is a form of courage.', ref: undefined },
  { text: 'Do justice. Love kindness. Walk humbly.', ref: 'Micah 6:8' },
  { text: 'One conversation can change everything.', ref: undefined },
  { text: 'You are enough, exactly as you are, right now.', ref: undefined },
  { text: 'Service is the rent we pay for our place on earth.', ref: undefined },
  { text: 'The present moment is where life actually happens.', ref: undefined },
  { text: 'There is no exhaustion like the exhaustion of pretending.', ref: undefined },
  { text: 'Let your roots grow deep so your branches can reach far.', ref: 'Colossians 2:7' },
  { text: 'Fear not — you were made for connection, not isolation.', ref: 'Isaiah 41:10' },
  { text: 'Every person you meet is fighting a battle you know nothing about.', ref: undefined },
  { text: 'Showing up imperfectly is infinitely better than not showing up.', ref: undefined },
  { text: 'When we help others heal, we heal ourselves too.', ref: undefined },
  { text: 'You belong here. This community is yours.', ref: undefined },
];

function getDailyAffirmation() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date().getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Featured Contributor Card ────────────────────────────────────
function FeaturedCard({ org }: { org: any }) {
  const initials = org.name
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={[featStyles.card, { width: SCREEN_WIDTH - 40 }]}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.88}
    >
      <View style={featStyles.topAccent} />
      <View style={featStyles.body}>
        <View style={featStyles.headerRow}>
          <View style={featStyles.avatar}>
            <Text style={featStyles.avatarText}>{initials}</Text>
          </View>
          <View style={featStyles.badges}>
            <View style={featStyles.featuredPill}>
              <Text style={featStyles.featuredPillText}>⭐ Featured</Text>
            </View>
            {org.is_verified && (
              <View style={featStyles.verifiedPill}>
                <Text style={featStyles.verifiedPillText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={featStyles.name}>{org.name}</Text>
        {org.short_description ? (
          <Text style={featStyles.desc} numberOfLines={3}>
            {org.short_description}
          </Text>
        ) : null}

        <View style={featStyles.footer}>
          {location ? (
            <Text style={featStyles.location}>📍 {location}</Text>
          ) : <View />}
          <Text style={featStyles.cta}>Learn more →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Carousel dot indicators ──────────────────────────────────────
function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[dotStyles.dot, i === active && dotStyles.dotActive]} />
      ))}
    </View>
  );
}

// ── Activity item row ────────────────────────────────────────────
function ActivityItem({
  icon, label, onPress,
}: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={actStyles.row} onPress={onPress} activeOpacity={0.75}>
      <Text style={actStyles.icon}>{icon}</Text>
      <Text style={actStyles.label} numberOfLines={1}>{label}</Text>
      <Text style={actStyles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Event near-you card ──────────────────────────────────────────
function EventNearYouCard({ occ }: { occ: any }) {
  const ev = occ.events;
  const date = new Date(occ.starts_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={evStyles.card}
      onPress={() => router.push(`/event/${ev.id}`)}
      activeOpacity={0.85}
    >
      <View style={evStyles.dateBox}>
        <Text style={evStyles.dateMonth}>{dateStr.split(' ')[0]}</Text>
        <Text style={evStyles.dateDay}>{dateStr.split(' ')[1]}</Text>
      </View>
      <View style={evStyles.info}>
        <Text style={evStyles.title} numberOfLines={2}>{ev.title}</Text>
        <Text style={evStyles.time}>{timeStr}</Text>
        {(ev.city || ev.state) ? (
          <Text style={evStyles.loc} numberOfLines={1}>
            📍 {[ev.city, ev.state].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { open } = useDrawerStore();

  const [featured, setFeatured]         = useState<any[]>([]);
  const [carouselIdx, setCarouselIdx]   = useState(0);
  const [activity, setActivity]         = useState<Array<{ icon: string; label: string; route: string }>>([]);
  const [eventsNearby, setEventsNearby] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const affirmation = getDailyAffirmation();
  const firstName = profile?.display_name?.split(' ')[0] ?? null;

  // ── Fetch featured contributors (location-filtered if possible) ──
  useEffect(() => {
    async function loadFeatured() {
      setLoadingFeatured(true);
      let query = supabase
        .from('organizations')
        .select('id, name, short_description, category, city, state, is_verified')
        .eq('is_featured', true)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(8);

      // Prefer local first — fall back to all featured
      if (profile?.location_city) {
        const { data: local } = await query.eq('city', profile.location_city);
        if (local && local.length > 0) { setFeatured(local); setLoadingFeatured(false); return; }
      }
      const { data } = await query;
      setFeatured(data ?? []);
      setLoadingFeatured(false);
    }
    loadFeatured();
  }, [profile?.location_city]);

  // ── Fetch activity (unread messages + upcoming RSVPs) ───────────
  useEffect(() => {
    if (!profile?.id) return;
    async function loadActivity() {
      const userId = profile!.id;
      const items: Array<{ icon: string; label: string; route: string }> = [];

      // Unread conversations
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at, conversations(last_message_at)')
        .eq('user_id', userId)
        .not('conversations', 'is', null)
        .limit(5);

      const unreadConvs = (parts ?? []).filter((p: any) => {
        const lastMsg = p.conversations?.last_message_at;
        return lastMsg && (!p.last_read_at || p.last_read_at < lastMsg);
      });
      if (unreadConvs.length === 1) {
        items.push({ icon: '💬', label: '1 unread message', route: '/conversations' });
      } else if (unreadConvs.length > 1) {
        items.push({ icon: '💬', label: `${unreadConvs.length} unread messages`, route: '/conversations' });
      }

      // Upcoming RSVPs (next 7 days)
      const now = new Date().toISOString();
      const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_occurrences!inner(id, starts_at, events!inner(title))')
        .eq('user_id', userId)
        .gte('event_occurrences.starts_at', now)
        .lte('event_occurrences.starts_at', soon)
        .is('cancelled_at', null)
        .limit(3);

      (rsvps ?? []).forEach((r: any) => {
        const occ = r.event_occurrences;
        if (!occ) return;
        const title = occ.events?.title ?? 'Event';
        const date = new Date(occ.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        items.push({ icon: '📅', label: `${title} · ${date}`, route: `/event/${occ.events?.id ?? occ.id}` });
      });

      setActivity(items.slice(0, 3));
    }
    loadActivity();
  }, [profile?.id]);

  // ── Fetch events near user ──────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    async function loadNearby() {
      const now = new Date().toISOString();
      const month = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('event_occurrences')
        .select('id, starts_at, events!inner(id, title, city, state, category)')
        .eq('status', 'scheduled')
        .gte('starts_at', now)
        .lte('starts_at', month)
        .order('starts_at', { ascending: true })
        .limit(6);

      if (profile?.location_city) {
        query = query.eq('events.city', profile.location_city);
      } else if (profile?.location_state) {
        query = query.eq('events.state', profile.location_state);
      }

      const { data } = await query;
      setEventsNearby(data ?? []);
    }
    loadNearby();
  }, [profile?.location_city, profile?.location_state]);

  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setCarouselIdx(Math.round(x / (SCREEN_WIDTH - 40)));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── SECTION 1: Identity / Welcome ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={open}
            style={styles.hamburgerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.hamLine} />
            <View style={[styles.hamLine, { width: 13 }]} />
            <View style={styles.hamLine} />
          </TouchableOpacity>

          <Image
            source={require('../../assets/brand/images/app-icon.png')}
            style={styles.topBarIcon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </Text>
        </View>

        {/* Mission statement */}
        <View style={styles.missionRow}>
          <Image
            source={require('../../assets/brand/images/lv-mark.png')}
            style={styles.missionLogo}
            resizeMode="contain"
          />
          <Text style={styles.missionText}>
            Connecting you to real help, real people, and real community.
          </Text>
        </View>

        {/* Your Activity bar */}
        {activity.length > 0 && (
          <View style={styles.activityBlock}>
            <Text style={styles.sectionMicrolabel}>YOUR ACTIVITY</Text>
            <View style={styles.activityCard}>
              {activity.map((item, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.activityDivider} />}
                  <ActivityItem
                    icon={item.icon}
                    label={item.label}
                    onPress={() => router.push(item.route as any)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SECTION 2: Featured Contributors (hero) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionLabel}>⭐  FEATURED CONTRIBUTORS</Text>
          </View>
          <Text style={styles.sectionSub}>
            {profile?.location_city
              ? `Spotlight organizations in ${profile.location_city}`
              : 'Spotlight organizations making a real difference'}
          </Text>

          {loadingFeatured ? (
            <View style={styles.carouselLoader}>
              <ActivityIndicator color="#B8864E" size="small" />
            </View>
          ) : featured.length > 0 ? (
            <View>
              <FlatList
                data={featured}
                keyExtractor={(o) => o.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH - 40}
                decelerationRate="fast"
                onMomentumScrollEnd={handleCarouselScroll}
                contentContainerStyle={styles.carouselContainer}
                renderItem={({ item }) => <FeaturedCard org={item} />}
                scrollEventThrottle={16}
              />
              <CarouselDots count={featured.length} active={carouselIdx} />
            </View>
          ) : (
            <View style={featStyles.emptyCard}>
              <Text style={featStyles.emptyIcon}>🌱</Text>
              <Text style={featStyles.emptyTitle}>Be a Featured Contributor</Text>
              <Text style={featStyles.emptyBody}>
                Reach your local community and connect with people who need what you offer.
              </Text>
            </View>
          )}
        </View>

        {/* ── SECTION 3: Quick Direction ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT BRINGS YOU HERE?</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnRed]}
              onPress={() => router.push('/emergency')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>🆘</Text>
              <Text style={styles.actionBtnLabel}>Get Help</Text>
              <Text style={styles.actionBtnSub}>Emergency & crisis resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnBlue]}
              onPress={() => router.push('/(tabs)/resources' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>🤝</Text>
              <Text style={styles.actionBtnLabel}>Find Support</Text>
              <Text style={styles.actionBtnSub}>Counseling, care & community</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGreen]}
              onPress={() => router.push('/(tabs)/opportunities' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>💛</Text>
              <Text style={styles.actionBtnLabel}>Help Others</Text>
              <Text style={styles.actionBtnSub}>Volunteer & serve your community</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 4: Daily Affirmation ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🌱  DAILY AFFIRMATION</Text>
          <View style={styles.affirmCard}>
            <Text style={styles.affirmText}>"{affirmation.text}"</Text>
            {affirmation.ref && (
              <Text style={styles.affirmRef}>— {affirmation.ref}</Text>
            )}
          </View>
        </View>

        {/* ── Events Near You (shown only if there are results) ── */}
        {eventsNearby.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionLabel}>📍  EVENTS NEAR YOU</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events' as any)}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsRow}
            >
              {eventsNearby.map((occ) => (
                <EventNearYouCard key={occ.id} occ={occ} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* No location set — soft prompt */}
        {eventsNearby.length === 0 && profile && !profile.location_city && !profile.location_state && (
          <View style={styles.section}>
            <View style={styles.locationPrompt}>
              <Text style={styles.locationPromptText}>
                📍 Add your city in{' '}
                <Text
                  style={styles.locationPromptLink}
                  onPress={() => router.push('/(tabs)/profile' as any)}
                >
                  Profile
                </Text>
                {' '}to see local events and contributors near you.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Featured card styles ─────────────────────────────────────────
const featStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5DDD4',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 5,
    marginRight: 16,
  },
  topAccent: { height: 6, backgroundColor: '#B8864E' },
  body: { padding: 22 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FDF3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#B8864E', fontWeight: '800', fontSize: 20 },
  badges: { gap: 8, alignItems: 'flex-end' },
  featuredPill: {
    backgroundColor: '#FDF3E3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F0D9B8',
  },
  featuredPillText: { fontSize: 11, fontWeight: '800', color: '#B8864E', letterSpacing: 0.2 },
  verifiedPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedPillText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: '#78716C',
    lineHeight: 22,
    marginBottom: 20,
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
  cta: { fontSize: 14, color: '#B8864E', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FDFAF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917', marginBottom: 6 },
  emptyBody: { fontSize: 13, color: '#78716C', textAlign: 'center', lineHeight: 20 },
});

// ── Dot styles ───────────────────────────────────────────────────
const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
    paddingBottom: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5DDD4' },
  dotActive: { backgroundColor: '#B8864E', width: 18 },
});

// ── Activity styles ──────────────────────────────────────────────
const actStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 14, color: '#1C1917', fontWeight: '500' },
  chevron: { fontSize: 20, color: '#C4B9AF' },
});

// ── Event near-you styles ────────────────────────────────────────
const evStyles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginRight: 12,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBox: {
    width: 40,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 6,
  },
  dateMonth: { fontSize: 10, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase' },
  dateDay: { fontSize: 18, fontWeight: '800', color: '#2E7D32', lineHeight: 22 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#1C1917', lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 12, color: '#78716C', marginBottom: 2 },
  loc: { fontSize: 11, color: '#A8A29E' },
});

// ── Screen styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingBottom: 48 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  hamLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: '#1C1917' },
  topBarIcon: { width: 36, height: 36 },

  // Greeting
  greetingBlock: { paddingHorizontal: 20, marginBottom: 16 },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.4,
  },

  // Mission statement
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  missionLogo: { width: 36, height: 36 },
  missionText: {
    flex: 1,
    fontSize: 13,
    color: '#78716C',
    lineHeight: 19,
    fontStyle: 'italic',
  },

  // Activity
  activityBlock: { marginHorizontal: 20, marginBottom: 20 },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    overflow: 'hidden',
    marginTop: 8,
  },
  activityDivider: { height: 1, backgroundColor: '#F0EBE4', marginHorizontal: 16 },

  // Section layout
  section: { marginHorizontal: 20, marginBottom: 28 },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  sectionMicrolabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionSub: { fontSize: 13, color: '#78716C', marginBottom: 14 },
  seeAll: { fontSize: 13, color: '#2E7D32', fontWeight: '700' },

  carouselContainer: { paddingRight: 4 },
  carouselLoader: { paddingVertical: 40, alignItems: 'center' },

  // Action buttons
  actionGrid: { gap: 10, marginTop: 10 },
  actionBtn: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtnRed:   { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnBlue:  { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  actionBtnIcon: { fontSize: 26 },
  actionBtnLabel: { fontSize: 16, fontWeight: '800', color: '#1C1917', flex: 1 },
  actionBtnSub: {
    position: 'absolute',
    bottom: 14,
    left: 58,
    right: 18,
    fontSize: 11,
    color: '#78716C',
  },

  // Affirmation
  affirmCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 8,
  },
  affirmText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#1C1917',
    lineHeight: 26,
    marginBottom: 8,
  },
  affirmRef: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  // Events row
  eventsRow: { paddingRight: 4 },

  // Location prompt
  locationPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  locationPromptText: { fontSize: 14, color: '#78716C', lineHeight: 21 },
  locationPromptLink: { color: '#2E7D32', fontWeight: '700' },
});
