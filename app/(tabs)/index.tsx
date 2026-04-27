import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet,
  TouchableOpacity, ScrollView, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/auth';
import { useDrawerStore } from '../../src/store/drawer';
import { useSettingsStore } from '../../src/store/settings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Contributor category options (shown in first-load picker) ────
export const HOME_CATEGORIES = [
  { key: 'church',        label: 'Churches' },
  { key: 'ministry',      label: 'Ministries' },
  { key: 'support_group', label: 'Support Groups' },
  { key: 'therapy',       label: 'Counseling & Therapy' },
  { key: 'medical',       label: 'Medical' },
  { key: 'community',     label: 'Community Orgs' },
  { key: 'events',        label: 'Upcoming Events' },
  { key: 'opportunities', label: 'Volunteer Opportunities' },
];

// ── Daily affirmations — NKJV scripture (rotates by day-of-year) ─
const AFFIRMATIONS = [
  { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { text: 'For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope.', ref: 'Jeremiah 29:11' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.', ref: 'Proverbs 3:5-6' },
  { text: 'Be strong and of good courage; do not be afraid, nor be dismayed, for the Lord your God is with you wherever you go.', ref: 'Joshua 1:9' },
  { text: 'Come to Me, all you who labor and are heavy laden, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.', ref: 'John 3:16' },
  { text: 'The Lord your God in your midst, the Mighty One, will save; He will rejoice over you with gladness, He will quiet you with His love, He will rejoice over you with singing.', ref: 'Zephaniah 3:17' },
  { text: 'Those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.', ref: 'Isaiah 40:31' },
  { text: 'Neither death nor life, nor angels nor principalities nor powers, nor things present nor things to come, nor height nor depth, nor any other created thing, shall be able to separate us from the love of God which is in Christ Jesus our Lord.', ref: 'Romans 8:38-39' },
  { text: 'We know that all things work together for good to those who love God, to those who are the called according to His purpose.', ref: 'Romans 8:28' },
  { text: 'Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God.', ref: 'Philippians 4:6' },
  { text: 'The peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus.', ref: 'Philippians 4:7' },
  { text: 'Beloved, let us love one another, for love is of God; and everyone who loves is born of God and knows God.', ref: '1 John 4:7' },
  { text: 'A new commandment I give to you, that you love one another; as I have loved you, that you also love one another.', ref: 'John 13:34' },
  { text: 'If anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.', ref: '2 Corinthians 5:17' },
  { text: 'He gives power to the weak, and to those who have no might He increases strength.', ref: 'Isaiah 40:29' },
  { text: 'Cast your burden on the Lord, and He shall sustain you; He shall never permit the righteous to be moved.', ref: 'Psalm 55:22' },
  { text: 'The Lord is near to those who have a broken heart, and saves such as have a contrite spirit.', ref: 'Psalm 34:18' },
  { text: 'May the God of hope fill you with all joy and peace in believing, that you may abound in hope by the power of the Holy Spirit.', ref: 'Romans 15:13' },
  { text: 'Let us not grow weary while doing good, for in due season we shall reap if we do not lose heart.', ref: 'Galatians 6:9' },
  { text: 'The Lord will fight for you, and you shall hold your peace.', ref: 'Exodus 14:14' },
  { text: 'He heals the brokenhearted and binds up their wounds.', ref: 'Psalm 147:3' },
  { text: 'Two are better than one, because they have a good reward for their labor. For if they fall, one will lift up his companion.', ref: 'Ecclesiastes 4:9-10' },
  { text: 'Bear one another\'s burdens, and so fulfill the law of Christ.', ref: 'Galatians 6:2' },
  { text: 'Comfort each other and edify one another, just as you also are doing.', ref: '1 Thessalonians 5:11' },
  { text: 'For where two or three are gathered together in My name, I am there in the midst of them.', ref: 'Matthew 18:20' },
  { text: 'Strength and honor are her clothing; she shall rejoice in time to come.', ref: 'Proverbs 31:25' },
  { text: 'This is the day the Lord has made; we will rejoice and be glad in it.', ref: 'Psalm 118:24' },
  { text: 'He who began a good work in you will complete it until the day of Jesus Christ.', ref: 'Philippians 1:6' },
];

function getDailyAffirmation() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
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
  const initials = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      style={[featStyles.card, { width: SCREEN_WIDTH - 48 }]}
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
            {org.is_partner ? (
              <View style={[featStyles.featuredPill, featStyles.partnerPill]}>
                <Text style={[featStyles.featuredPillText, featStyles.partnerPillText]}>★ Partner</Text>
              </View>
            ) : (
              <View style={featStyles.featuredPill}>
                <Text style={featStyles.featuredPillText}>Featured Contributor</Text>
              </View>
            )}
            {org.is_verified && (
              <View style={featStyles.verifiedPill}>
                <Text style={featStyles.verifiedPillText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={featStyles.name}>{org.name}</Text>
        {org.short_description ? (
          <Text style={featStyles.desc} numberOfLines={3}>{org.short_description}</Text>
        ) : null}
        <View style={featStyles.footer}>
          {location ? <Text style={featStyles.location}>{location}</Text> : <View />}
          <Text style={featStyles.cta}>Learn more →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Generic small org card (for category carousel) ───────────────
function OrgSmallCard({ org }: { org: any }) {
  const initials = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location = [org.city, org.state].filter(Boolean).join(', ');
  return (
    <TouchableOpacity
      style={smallStyles.card}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.85}
    >
      <View style={smallStyles.avatar}>
        <Text style={smallStyles.avatarText}>{initials}</Text>
      </View>
      <Text style={smallStyles.name} numberOfLines={2}>{org.name}</Text>
      {location ? <Text style={smallStyles.loc} numberOfLines={1}>{location}</Text> : null}
    </TouchableOpacity>
  );
}

// ── Event near-you card ──────────────────────────────────────────
function EventCard({ occ }: { occ: any }) {
  const ev = occ.events;
  const date = new Date(occ.starts_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const [month, day] = dateStr.split(' ');

  return (
    <TouchableOpacity
      style={evStyles.card}
      onPress={() => router.push(`/event/${ev.id}`)}
      activeOpacity={0.85}
    >
      <View style={evStyles.dateBox}>
        <Text style={evStyles.dateMonth}>{month}</Text>
        <Text style={evStyles.dateDay}>{day}</Text>
      </View>
      <View style={evStyles.info}>
        <Text style={evStyles.title} numberOfLines={2}>{ev.title}</Text>
        <Text style={evStyles.time}>{timeStr}</Text>
        {(ev.city || ev.state) ? (
          <Text style={evStyles.loc} numberOfLines={1}>{[ev.city, ev.state].filter(Boolean).join(', ')}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Opportunity small card ────────────────────────────────────────
function OpportunityCard({ opp }: { opp: any }) {
  return (
    <TouchableOpacity
      style={oppStyles.card}
      onPress={() => router.push(`/opportunity/${opp.id}`)}
      activeOpacity={0.85}
    >
      <Text style={oppStyles.title} numberOfLines={2}>{opp.title}</Text>
      {opp.short_description ? (
        <Text style={oppStyles.desc} numberOfLines={2}>{opp.short_description}</Text>
      ) : null}
      <Text style={oppStyles.cta}>See details →</Text>
    </TouchableOpacity>
  );
}

// ── Carousel dots ────────────────────────────────────────────────
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

// ── Daily Affirmation card ───────────────────────────────────────
function AffirmationCard() {
  const aff = getDailyAffirmation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>DAILY AFFIRMATION</Text>
      <View style={affStyles.card}>
        <Text style={affStyles.text}>"{aff.text}"</Text>
        {aff.ref && <Text style={affStyles.ref}>— {aff.ref}</Text>}
      </View>
    </View>
  );
}

// ── Category picker (first-load inline prompt) ───────────────────
function CategoryPicker({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>PERSONALIZE YOUR FEED</Text>
      <Text style={styles.sectionSub}>What are you most interested in? Choose one to customize your home screen.</Text>
      <View style={pickerStyles.grid}>
        {HOME_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={pickerStyles.chip}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.8}
          >
            <Text style={pickerStyles.chipText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { open } = useDrawerStore();
  const {
    homeCarouselCategory,
    homeCarouselPrompted,
    showDailyAffirmation,
    affirmationPosition,
    setHomeCarouselCategory,
  } = useSettingsStore();

  const [featured, setFeatured]         = useState<any[]>([]);
  const [featuredIdx, setFeaturedIdx]   = useState(0);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const [carouselItems, setCarouselItems]   = useState<any[]>([]);
  const [carouselIdx, setCarouselIdx]       = useState(0);
  const [loadingCarousel, setLoadingCarousel] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [rsvpItems, setRsvpItems] = useState<Array<{ label: string; route: string }>>([]);

  const affirmation = getDailyAffirmation();
  // Greeting name: first_name field → first word of display_name → username
  const nameLabel = profile?.first_name
    ?? profile?.display_name?.split(' ')[0]
    ?? profile?.username
    ?? null;

  // Animated greeting fade-out after 3.5 s
  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const [greetingGone, setGreetingGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(greetingOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => setGreetingGone(true));
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  // ── Featured contributors ────────────────────────────────────
  // Enhanced (is_featured) + Partner (is_partner) both appear here.
  // Partners sort first within the carousel.
  // Results are state-scoped — no out-of-state orgs on home page.
  useEffect(() => {
    async function load() {
      setLoadingFeatured(true);

      const base = supabase
        .from('organizations')
        .select('id, name, short_description, city, state, is_verified, is_featured, is_partner')
        .eq('is_featured', true)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('is_partner', { ascending: false })
        .order('name')
        .limit(10);

      // Try state-scoped first; fall back to all featured if user has no location
      let data: any[] | null = null;
      if (profile?.location_state) {
        const { data: stateData } = await base.eq('state', profile.location_state);
        data = stateData ?? [];
        // If nothing in state, still show nothing — don't leak out-of-state onto home
      } else {
        const { data: allData } = await base;
        data = allData ?? [];
      }

      // Sort: partner → city match → state match → rest
      const city  = profile?.location_city?.toLowerCase()  ?? '';
      const state = profile?.location_state?.toLowerCase() ?? '';
      data.sort((a: any, b: any) => {
        if (a.is_partner !== b.is_partner) return b.is_partner ? 1 : -1;
        const aCity = a.city?.toLowerCase() === city  ? 0 : 1;
        const bCity = b.city?.toLowerCase() === city  ? 0 : 1;
        if (aCity !== bCity) return aCity - bCity;
        return 0;
      });

      setFeatured(data);
      setLoadingFeatured(false);
    }
    load();
  }, [profile?.location_city, profile?.location_state]);

  // ── Category carousel ────────────────────────────────────────
  useEffect(() => {
    if (!homeCarouselCategory) return;
    setLoadingCarousel(true);
    const cat = homeCarouselCategory;

    async function load() {
      if (cat === 'events') {
        const now = new Date().toISOString();
        const month = new Date(Date.now() + 30 * 86400000).toISOString();
        let q = supabase
          .from('event_occurrences')
          .select('id, starts_at, events!inner(id, title, city, state)')
          .eq('status', 'scheduled')
          .gte('starts_at', now)
          .lte('starts_at', month)
          .order('starts_at', { ascending: true })
          .limit(8);
        if (profile?.location_city) q = q.eq('events.city', profile.location_city);
        else if (profile?.location_state) q = q.eq('events.state', profile.location_state);
        const { data } = await q;
        setCarouselItems(data ?? []);
      } else if (cat === 'opportunities') {
        const { data } = await supabase
          .from('opportunities')
          .select('id, title, short_description')
          .eq('status', 'open')
          .is('deleted_at', null)
          .limit(8);
        setCarouselItems(data ?? []);
      } else {
        let q = supabase
          .from('organizations')
          .select('id, name, city, state')
          .eq('category', cat)
          .eq('is_active', true)
          .is('deleted_at', null)
          .limit(8);
        if (profile?.location_city) q = q.eq('city', profile.location_city);
        else if (profile?.location_state) q = q.eq('state', profile.location_state);
        const { data } = await q;
        setCarouselItems(data ?? []);
      }
      setLoadingCarousel(false);
    }
    load();
  }, [homeCarouselCategory, profile?.location_city, profile?.location_state]);

  // ── Activity bar ──────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;
    async function loadActivity() {
      const userId = profile!.id;

      // Unread message count
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at, conversations(last_message_at)')
        .eq('user_id', userId)
        .not('conversations', 'is', null)
        .limit(20);

      const unread = (parts ?? []).filter((p: any) => {
        const lastMsg = p.conversations?.last_message_at;
        return lastMsg && (!p.last_read_at || p.last_read_at < lastMsg);
      });
      setUnreadCount(unread.length);

      // Upcoming RSVPs (next 7 days)
      const now = new Date().toISOString();
      const soon = new Date(Date.now() + 7 * 86400000).toISOString();
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_occurrences!inner(id, starts_at, events!inner(id, title))')
        .eq('user_id', userId)
        .gte('event_occurrences.starts_at', now)
        .lte('event_occurrences.starts_at', soon)
        .is('cancelled_at', null)
        .limit(3);

      const rsvpRows = (rsvps ?? []).map((r: any) => {
        const occ = r.event_occurrences;
        const date = new Date(occ.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return { label: `${occ.events?.title ?? 'Event'} · ${date}`, route: `/event/${occ.events?.id ?? occ.id}` };
      });
      setRsvpItems(rsvpRows);
    }
    loadActivity();
  }, [profile?.id]);

  function handleFeaturedScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setFeaturedIdx(Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48)));
  }
  function handleCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setCarouselIdx(Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48)));
  }

  const chosenCatLabel = HOME_CATEGORIES.find(c => c.key === homeCarouselCategory)?.label ?? '';

  const affirmationCard = showDailyAffirmation ? <AffirmationCard /> : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Top bar ── */}
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
          <View style={styles.topBarSpacer} />
          <Image
            source={require('../../assets/brand/images/app-icon.png')}
            style={styles.topBarIcon}
            resizeMode="contain"
          />
        </View>

        {/* ── Greeting (fades out after 3.5s) ── */}
        {!greetingGone && (
          <Animated.Text style={[styles.greeting, { opacity: greetingOpacity }]}>
            {greeting()}{nameLabel ? `, ${nameLabel}` : ''}.
          </Animated.Text>
        )}

        {/* ── Wordmark + mission statement (no card) ── */}
        <View style={styles.wordmarkBlock}>
          <Text style={styles.wordmark}>
            <Text style={styles.wordmarkLife}>Life</Text>
            <Text style={styles.wordmarkVine}>Vine</Text>
          </Text>
          <Text style={styles.missionStatement}>
            Connecting you to real help, real people, and real community.
          </Text>
        </View>

        {/* ── Affirmation at top (if configured) ── */}
        {affirmationPosition === 'top' && affirmationCard}

        {/* ── Activity bar (notifications mini-dashboard) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR ACTIVITY</Text>
          <View style={actStyles.card}>
            {/* Messages row — always visible */}
            <TouchableOpacity
              style={actStyles.row}
              onPress={() => router.push('/conversations' as any)}
              activeOpacity={0.75}
            >
              <View style={[actStyles.dot, unreadCount > 0 && actStyles.dotActive]} />
              <Text style={actStyles.label}>
                {unreadCount === 0
                  ? 'No new messages'
                  : unreadCount === 1
                    ? '1 unread message'
                    : `${unreadCount} unread messages`}
              </Text>
              <Text style={actStyles.chevron}>›</Text>
            </TouchableOpacity>
            {/* Upcoming RSVP rows */}
            {rsvpItems.map((item, i) => (
              <View key={i}>
                <View style={actStyles.divider} />
                <TouchableOpacity
                  style={actStyles.row}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.75}
                >
                  <View style={[actStyles.dot, actStyles.dotActive]} />
                  <Text style={actStyles.label} numberOfLines={1}>{item.label}</Text>
                  <Text style={actStyles.chevron}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ── Featured Contributors ── */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <Text style={styles.sectionLabelFeatured}>FEATURED CONTRIBUTORS</Text>
          <Text style={styles.sectionSub}>
            {profile?.location_city
              ? `Spotlight organizations in ${profile.location_city}`
              : 'Spotlight organizations making a real difference'}
          </Text>

          {loadingFeatured ? (
            <View style={styles.carouselLoader}>
              <ActivityIndicator color="#B8864E" />
            </View>
          ) : featured.length > 0 ? (
            <>
              <FlatList
                data={featured}
                keyExtractor={(o) => o.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH - 48}
                decelerationRate="fast"
                onMomentumScrollEnd={handleFeaturedScroll}
                contentContainerStyle={styles.carouselContent}
                renderItem={({ item }) => <FeaturedCard org={item} />}
                scrollEventThrottle={16}
              />
              <CarouselDots count={featured.length} active={featuredIdx} />
            </>
          ) : (
            <View style={featStyles.empty}>
              <Text style={featStyles.emptyText}>
                No featured contributors yet.{'\n'}Check back soon.
              </Text>
            </View>
          )}
        </View>

        {/* ── Category carousel (user-chosen) ── */}
        {!homeCarouselPrompted && !homeCarouselCategory ? (
          <CategoryPicker onSelect={setHomeCarouselCategory} />
        ) : homeCarouselCategory ? (
          <View style={[styles.section, { marginTop: 16 }]}>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionLabel}>{chosenCatLabel.toUpperCase()}</Text>
              {homeCarouselCategory === 'events' && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/events' as any)}>
                  <Text style={styles.seeAll}>See All →</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingCarousel ? (
              <View style={styles.carouselLoader}>
                <ActivityIndicator color="#2E7D32" />
              </View>
            ) : carouselItems.length > 0 ? (
              homeCarouselCategory === 'events' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hScrollContent}
                >
                  {carouselItems.map((occ) => <EventCard key={occ.id} occ={occ} />)}
                </ScrollView>
              ) : homeCarouselCategory === 'opportunities' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hScrollContent}
                >
                  {carouselItems.map((opp) => <OpportunityCard key={opp.id} opp={opp} />)}
                </ScrollView>
              ) : (
                <>
                  <FlatList
                    data={carouselItems}
                    keyExtractor={(o) => o.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SCREEN_WIDTH - 48}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleCarouselScroll}
                    contentContainerStyle={styles.carouselContent}
                    renderItem={({ item }) => <OrgSmallCard org={item} />}
                    scrollEventThrottle={16}
                  />
                  <CarouselDots count={carouselItems.length} active={carouselIdx} />
                </>
              )
            ) : (
              <Text style={styles.emptyText}>
                Nothing in this category near you yet.
              </Text>
            )}
          </View>
        ) : null}

        {/* ── Affirmation at bottom (default) ── */}
        {affirmationPosition === 'bottom' && affirmationCard}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Featured styles ──────────────────────────────────────────────
const featStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5DDD4',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 7,
    marginRight: 12,
  },
  topAccent: { height: 10, backgroundColor: '#B8864E' },
  body: { padding: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 22, backgroundColor: '#FDF3E3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#B8864E', fontWeight: '800', fontSize: 32 },
  badges: { gap: 8, alignItems: 'flex-end' },
  featuredPill: { backgroundColor: '#FDF3E3', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#F0D9B8' },
  featuredPillText: { fontSize: 12, fontWeight: '800', color: '#B8864E', letterSpacing: 0.3 },
  partnerPill: { backgroundColor: '#1A3A2A', borderColor: '#2D6A4F' },
  partnerPillText: { color: '#FFFFFF' },
  verifiedPill: { backgroundColor: '#E8F5E9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  verifiedPillText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  name: { fontSize: 26, fontWeight: '800', color: '#1C1917', letterSpacing: -0.6, marginBottom: 12 },
  desc: { fontSize: 16, color: '#78716C', lineHeight: 25, marginBottom: 28 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EBE4', paddingTop: 20 },
  location: { fontSize: 14, color: '#A8A29E' },
  cta: { fontSize: 15, color: '#B8864E', fontWeight: '700' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#A8A29E', textAlign: 'center', lineHeight: 22 },
});

// ── Small org card (category carousel) ──────────────────────────
const smallStyles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    marginRight: 12,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#2E7D32', fontWeight: '800', fontSize: 14 },
  name: { fontSize: 13, fontWeight: '700', color: '#1C1917', lineHeight: 18, marginBottom: 4 },
  loc: { fontSize: 11, color: '#A8A29E' },
});

// ── Event card ───────────────────────────────────────────────────
const evStyles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  dateBox: { width: 40, alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 6 },
  dateMonth: { fontSize: 10, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase' },
  dateDay: { fontSize: 18, fontWeight: '800', color: '#2E7D32', lineHeight: 22 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#1C1917', lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 12, color: '#78716C', marginBottom: 2 },
  loc: { fontSize: 11, color: '#A8A29E' },
});

// ── Opportunity card ─────────────────────────────────────────────
const oppStyles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    marginRight: 12,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1C1917', lineHeight: 20, marginBottom: 6 },
  desc: { fontSize: 12, color: '#78716C', lineHeight: 18, marginBottom: 10 },
  cta: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
});

// ── Dot indicators ───────────────────────────────────────────────
const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 12, paddingBottom: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5DDD4' },
  dotActive: { backgroundColor: '#B8864E', width: 18 },
});

// ── Activity styles ──────────────────────────────────────────────
const actStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5DDD4', overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#F0EBE4', marginHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4C4B0', flexShrink: 0 },
  dotActive: { backgroundColor: '#2D6A4F' },
  label: { flex: 1, fontSize: 14, color: '#1C1917', fontWeight: '500' },
  chevron: { fontSize: 20, color: '#C4B9AF' },
});

// ── Affirmation styles ───────────────────────────────────────────
const affStyles = StyleSheet.create({
  card: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#BBF7D0', marginTop: 8 },
  text: { fontSize: 15, fontStyle: 'italic', color: '#1C1917', lineHeight: 24, marginBottom: 6 },
  ref: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
});

// ── Category picker styles ───────────────────────────────────────
const pickerStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#1C1917' },
});

// ── Screen styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingBottom: 48 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
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
  topBarSpacer: { flex: 1 },
  topBarIcon: { width: 38, height: 38 },

  // Greeting
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },

  // Wordmark + mission
  wordmarkBlock: { paddingHorizontal: 20, marginBottom: 36 },
  wordmark: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4, lineHeight: 38 },
  wordmarkLife: { color: '#1B5E20' },
  wordmarkVine: { color: '#4CAF50' },
  missionStatement: { fontSize: 14, color: '#78716C', lineHeight: 21 },

  // Sections
  section: { marginHorizontal: 20, marginBottom: 48 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#A8A29E', letterSpacing: 1.4, marginBottom: 4 },
  sectionLabelFeatured: { fontSize: 12, fontWeight: '800', color: '#B8864E', letterSpacing: 1.4, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#78716C', marginBottom: 14 },
  seeAll: { fontSize: 13, color: '#2E7D32', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#A8A29E', paddingVertical: 16 },

  carouselLoader: { paddingVertical: 32, alignItems: 'center' },
  carouselContent: { paddingRight: 4 },
  hScrollContent: { paddingRight: 4 },
});
