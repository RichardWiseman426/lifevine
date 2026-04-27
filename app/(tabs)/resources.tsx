import { useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOrganizations } from '../../src/hooks/useOrganizations';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

/**
 * Resources — contributor directory.
 * Matches Get Involved layout: sectioned carousels per contributor type.
 * Featured orgs (enhanced-tier) sort first within every carousel.
 */

const SECTIONS = [
  { value: 'church',        label: 'Churches',   subtitle: 'Worship communities & local ministries', color: '#7C3AED', cats: ['church', 'ministry']           },
  { value: 'therapy',       label: 'Counseling',  subtitle: 'Mental health & emotional support',      color: '#0284C7', cats: ['therapy']                      },
  { value: 'medical',       label: 'Medical',     subtitle: 'Healthcare, clinics & wellness care',    color: '#059669', cats: ['medical']                      },
  { value: 'support_group', label: 'Recovery',    subtitle: 'Addiction recovery & support groups',   color: '#D97706', cats: ['support_group']                 },
  { value: 'community',     label: 'Outreach',    subtitle: 'Community service & nonprofits',         color: '#DC2626', cats: ['community', 'nonprofit']       },
];

const TYPE_LABEL: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', therapy: 'Counseling',
  medical: 'Medical', support_group: 'Recovery', community: 'Outreach',
  nonprofit: 'Outreach',
};

function typeColor(cat: string): string {
  if (['church', 'ministry'].includes(cat))      return '#7C3AED';
  if (cat === 'therapy')                         return '#0284C7';
  if (cat === 'medical')                         return '#059669';
  if (cat === 'support_group')                   return '#D97706';
  if (['community', 'nonprofit'].includes(cat))  return '#DC2626';
  return '#78716C';
}

const ORG_CARD_W = 220;

// ── Org carousel card ──────────────────────────────────────────────
function OrgCarouselCard({ org, accentColor }: { org: any; accentColor: string }) {
  const initials  = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location  = [org.city, org.state].filter(Boolean).join(', ');
  const typeLabel = TYPE_LABEL[org.category] ?? org.category;

  return (
    <TouchableOpacity
      style={[orgCard.wrap, { width: ORG_CARD_W, borderTopColor: accentColor }]}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.85}
    >
      <View style={orgCard.body}>
        {/* Featured badge */}
        {org.is_featured && (
          <View style={orgCard.featuredBadge}>
            <Text style={orgCard.featuredText}>Featured Contributor</Text>
          </View>
        )}

        {/* Logo / initials */}
        <View style={orgCard.logoRow}>
          {org.logo_url ? (
            <Image source={{ uri: org.logo_url }} style={orgCard.logo} />
          ) : (
            <View style={[orgCard.logoFallback, { backgroundColor: accentColor + '1A' }]}>
              <Text style={[orgCard.logoText, { color: accentColor }]}>{initials}</Text>
            </View>
          )}
          {org.is_verified && (
            <View style={orgCard.verified}>
              <Text style={orgCard.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        <Text style={orgCard.name} numberOfLines={2}>{org.name}</Text>

        <View style={orgCard.typeRow}>
          <View style={[orgCard.typeChip, { backgroundColor: accentColor + '18' }]}>
            <Text style={[orgCard.typeChipText, { color: accentColor }]}>{typeLabel}</Text>
          </View>
        </View>

        {org.short_description ? (
          <Text style={orgCard.desc} numberOfLines={2}>{org.short_description}</Text>
        ) : null}

        {location ? <Text style={orgCard.location}>{location}</Text> : null}

        <Text style={[orgCard.cta, { color: accentColor }]}>View →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Section wrapper (mirrors Get Involved) ─────────────────────────
function Section({
  title, subtitle, color, onSearchMore, children,
}: {
  title: string; subtitle: string; color: string;
  onSearchMore?: () => void; children: React.ReactNode;
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
      {onSearchMore && (
        <TouchableOpacity style={sec.moreBtn} onPress={onSearchMore} activeOpacity={0.7}>
          <Text style={[sec.moreText, { color }]}>Search more {title.toLowerCase()} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function ResourcesScreen() {
  const { orgs, loading } = useOrganizations('', '');
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  const proximity = (o: any) => {
    if (userCity  && o.city?.toLowerCase()  === userCity)  return 0;
    if (userState && o.state?.toLowerCase() === userState) return 1;
    return 2;
  };

  // State-level distance filter:
  // Show orgs in the user's state only. Orgs with no state set are assumed
  // national and always included. If user has no state, show everything.
  const stateFiltered = useMemo(() => {
    if (!userState) return orgs;
    return orgs.filter(o => !o.state || o.state.toLowerCase() === userState);
  }, [orgs, userState]);

  // For each section: featured first → nearest → rest
  const orgsForSection = useMemo(() => {
    return SECTIONS.reduce<Record<string, any[]>>((acc, sec) => {
      acc[sec.value] = stateFiltered
        .filter(o => sec.cats.includes(o.category))
        .sort((a, b) => {
          // Partner tier: first in all carousels
          if (a.is_partner !== b.is_partner) return b.is_partner ? 1 : -1;
          // Then proximity
          const pd = proximity(a) - proximity(b);
          if (pd !== 0) return pd;
          // Enhanced (featured) floats above non-featured at same distance
          if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
          return 0;
        });
      return acc;
    }, {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFiltered, userCity, userState]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Resources"
        subtitle="Find churches, counseling, medical care & more"
      />

      {/* Location nudge */}
      {!profile?.location_city && (
        <TouchableOpacity
          style={styles.locationNudge}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.locationNudgeText}>
            Add your city to see nearby contributors first
          </Text>
          <Text style={styles.locationNudgeArrow}>→</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {SECTIONS.map((s, idx) => {
            const items = orgsForSection[s.value] ?? [];
            if (items.length === 0) return null;
            return (
              <View key={s.value}>
                <Section
                  title={s.label}
                  subtitle={s.subtitle}
                  color={s.color}
                  onSearchMore={() => router.push(`/browse-contributors?type=${s.value}` as any)}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselRow}
                    decelerationRate="fast"
                    snapToInterval={ORG_CARD_W + 12}
                  >
                    {items.map(org => (
                      <OrgCarouselCard key={org.id} org={org} accentColor={s.color} />
                    ))}
                  </ScrollView>
                </Section>
                {idx < SECTIONS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}

          {SECTIONS.every(s => (orgsForSection[s.value] ?? []).length === 0) && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No contributors listed yet. Check back soon.</Text>
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

  locationNudge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    marginHorizontal: 16, marginTop: 6, marginBottom: 2,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  locationNudgeText:  { fontSize: 13, color: '#2D6A4F', fontWeight: '600', flex: 1 },
  locationNudgeArrow: { fontSize: 16, color: '#2D6A4F', marginLeft: 8 },

  carouselRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  divider: {
    height: 1, backgroundColor: '#E5DDD4',
    marginHorizontal: 16, marginVertical: 8,
  },
  emptyCard: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5DDD4', padding: 20, alignItems: 'center',
  },
  emptyCardText: { fontSize: 13, color: '#A8A29E', textAlign: 'center' },
});

// ── Section styles ────────────────────────────────────────────────
const sec = StyleSheet.create({
  wrap:  { paddingTop: 16, paddingBottom: 8 },
  head:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  accentBar: { width: 4, borderRadius: 2, marginTop: 3, height: 36 },
  headText:  { flex: 1 },
  title:    { fontSize: 17, fontWeight: '800', color: '#1C1917', letterSpacing: -0.3, lineHeight: 22 },
  subtitle: { fontSize: 12, color: '#78716C', marginTop: 2 },
  moreBtn:  { marginHorizontal: 16, marginTop: 10, paddingVertical: 4 },
  moreText: { fontSize: 13, fontWeight: '700' },
});

// ── Org carousel card styles ──────────────────────────────────────
const orgCard = StyleSheet.create({
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
    backgroundColor: '#FDF3E3', marginBottom: 10,
  },
  featuredText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, color: '#B8864E' },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  logo: { width: 42, height: 42, borderRadius: 10 },
  logoFallback: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 14, fontWeight: '800' },
  verified: {
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2D6A4F',
  },
  verifiedText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  name:     { fontSize: 14, fontWeight: '800', color: '#1C1917', marginBottom: 7, lineHeight: 19, letterSpacing: -0.2 },
  typeRow:  { marginBottom: 6 },
  typeChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeChipText: { fontSize: 11, fontWeight: '600' },
  desc:     { fontSize: 12, color: '#78716C', lineHeight: 17, marginBottom: 6 },
  location: { fontSize: 11, color: '#A8A29E', marginBottom: 12 },
  cta:      { fontSize: 12, fontWeight: '700', borderTopWidth: 1, borderTopColor: '#E5DDD4', paddingTop: 10 },
});
