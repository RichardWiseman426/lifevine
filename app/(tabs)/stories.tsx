import { useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTestimonies } from '../../src/hooks/useTestimonies';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

/**
 * Stories — testimony feed.
 * Matches Get Involved layout: sectioned carousels per category.
 * Featured stories + local stories sort first within each carousel.
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = SCREEN_WIDTH * 0.72;

const SECTIONS = [
  { value: 'healing',     label: 'Healing',     subtitle: 'Stories of recovery and restoration',     color: '#F59E0B' },
  { value: 'provision',   label: 'Provision',   subtitle: 'Testimony of faithfulness in hard times',  color: '#10B981' },
  { value: 'community',   label: 'Community',   subtitle: 'Connection, belonging, and togetherness',  color: '#3B82F6' },
  { value: 'restoration', label: 'Restoration', subtitle: 'Lives renewed and purpose reclaimed',      color: '#EC4899' },
  { value: 'salvation',   label: 'Salvation',   subtitle: 'New beginnings and changed hearts',        color: '#8B5CF6' },
];

// ── Story carousel card ────────────────────────────────────────────
function StoryCard({ testimony: t, accentColor }: { testimony: any; accentColor: string }) {
  const authorName = t.is_anonymous
    ? 'Anonymous'
    : (t.profiles?.display_name ?? 'Someone');

  return (
    <TouchableOpacity
      style={[storyCard.wrap, { width: CARD_W, borderTopColor: accentColor }]}
      onPress={() => router.push(`/testimony/${t.id}`)}
      activeOpacity={0.85}
    >
      <View style={storyCard.body}>
        {/* Featured badge */}
        {t.is_featured && (
          <View style={[storyCard.featuredBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
            <Text style={[storyCard.featuredText, { color: accentColor }]}>★ Featured</Text>
          </View>
        )}

        <Text style={storyCard.title} numberOfLines={2}>{t.title}</Text>
        <Text style={storyCard.excerpt} numberOfLines={3}>{t.body}</Text>

        <View style={storyCard.footer}>
          <View style={[storyCard.dot, { backgroundColor: accentColor }]} />
          <Text style={storyCard.author} numberOfLines={1}>
            {authorName}
            {t.organizations?.name ? ` · ${t.organizations.name}` : ''}
          </Text>
        </View>

        <Text style={[storyCard.cta, { color: accentColor }]}>Read the full story →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Section wrapper (mirrors Get Involved) ─────────────────────────
function Section({
  title, subtitle, color, onSeeMore, children,
}: {
  title: string; subtitle: string; color: string;
  onSeeMore?: () => void; children: React.ReactNode;
}) {
  return (
    <View style={sec.wrap}>
      <View style={sec.head}>
        <View style={[sec.accentBar, { backgroundColor: color }]} />
        <View style={sec.headText}>
          <Text style={sec.title}>{title}</Text>
          <Text style={sec.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
      {onSeeMore && (
        <TouchableOpacity style={sec.moreBtn} onPress={onSeeMore} activeOpacity={0.7}>
          <Text style={[sec.moreText, { color }]}>See more {title.toLowerCase()} stories →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function StoriesScreen() {
  const { testimonies, loading } = useTestimonies('');
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  const isLocal = (t: any) => {
    const tCity  = (t.organizations?.city  ?? t.city)?.toLowerCase()  ?? '';
    const tState = (t.organizations?.state ?? t.state)?.toLowerCase() ?? '';
    if (userCity  && tCity  === userCity)  return true;
    if (userState && tState === userState) return true;
    return false;
  };

  // For each section: featured first → local → recent
  const storiesForSection = useMemo(() => {
    return SECTIONS.reduce<Record<string, any[]>>((acc, sec) => {
      acc[sec.value] = testimonies
        .filter(t => t.category === sec.value)
        .sort((a: any, b: any) => {
          // Partner org stories first
          const aP = a.organizations?.is_partner ?? false;
          const bP = b.organizations?.is_partner ?? false;
          if (aP !== bP) return bP ? 1 : -1;
          // Then featured stories
          if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
          // Then local
          const aLocal = isLocal(a) ? 0 : 1;
          const bLocal = isLocal(b) ? 0 : 1;
          if (aLocal !== bLocal) return aLocal - bLocal;
          // Then most recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      return acc;
    }, {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonies, userCity, userState]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Stories" subtitle="Real people. Real change." />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#B8864E" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* ── Share Story CTA ── */}
          <TouchableOpacity
            style={styles.shareCta}
            onPress={() => router.push('/submit-testimony')}
            activeOpacity={0.85}
          >
            <View style={styles.shareCtaLeft}>
              <Text style={styles.shareCtaTitle}>Share Your Story</Text>
              <Text style={styles.shareCtaSub}>
                Your experience could encourage someone today.
              </Text>
            </View>
            <Text style={styles.shareCtaArrow}>›</Text>
          </TouchableOpacity>

          {/* ── Category sections ── */}
          {SECTIONS.map((s, idx) => {
            const items = storiesForSection[s.value] ?? [];
            if (items.length === 0) return null;
            return (
              <View key={s.value}>
                <Section
                  title={s.label}
                  subtitle={s.subtitle}
                  color={s.color}
                  onSeeMore={items.length >= 3 ? () => {} : undefined}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselRow}
                    decelerationRate="fast"
                    snapToInterval={CARD_W + 12}
                  >
                    {items.map(t => (
                      <StoryCard key={t.id} testimony={t} accentColor={s.color} />
                    ))}
                  </ScrollView>
                </Section>
                {idx < SECTIONS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}

          {/* All sections empty */}
          {SECTIONS.every(s => (storiesForSection[s.value] ?? []).length === 0) && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptySub}>Be the first to share yours</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/submit-testimony')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Share Your Story</Text>
              </TouchableOpacity>
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

  shareCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#B8864E', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 18, paddingVertical: 16,
    shadowColor: '#B8864E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  shareCtaLeft:  { flex: 1 },
  shareCtaTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  shareCtaSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },
  shareCtaArrow: { fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '300', marginLeft: 12 },

  carouselRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  divider: {
    height: 1, backgroundColor: '#E5DDD4',
    marginHorizontal: 16, marginVertical: 8,
  },

  emptyWrap:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917', marginBottom: 6 },
  emptySub:   { fontSize: 14, color: '#A8A29E', marginBottom: 24, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#B8864E', borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 13,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

// ── Section styles ────────────────────────────────────────────────
const sec = StyleSheet.create({
  wrap:     { paddingTop: 16, paddingBottom: 8 },
  head:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  accentBar:{ width: 4, borderRadius: 2, marginTop: 3, height: 36 },
  headText: { flex: 1 },
  title:    { fontSize: 17, fontWeight: '800', color: '#1C1917', letterSpacing: -0.3, lineHeight: 22 },
  subtitle: { fontSize: 12, color: '#78716C', marginTop: 2 },
  moreBtn:  { marginHorizontal: 16, marginTop: 10, paddingVertical: 4 },
  moreText: { fontSize: 13, fontWeight: '700' },
});

// ── Story card styles ─────────────────────────────────────────────
const storyCard = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5DDD4', borderTopWidth: 4,
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  body: { padding: 14 },
  featuredBadge: {
    alignSelf: 'flex-start', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, marginBottom: 9,
  },
  featuredText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  title:   { fontSize: 15, fontWeight: '800', color: '#1C1917', marginBottom: 7, lineHeight: 20, letterSpacing: -0.2 },
  excerpt: { fontSize: 13, color: '#57534E', lineHeight: 19, marginBottom: 12 },
  footer:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot:     { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  author:  { fontSize: 12, color: '#78716C', fontWeight: '600', flex: 1 },
  cta:     { fontSize: 12, fontWeight: '700', borderTopWidth: 1, borderTopColor: '#E5DDD4', paddingTop: 10 },
});
