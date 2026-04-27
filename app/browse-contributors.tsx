import { useMemo } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  Text, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrganizations } from '../src/hooks/useOrganizations';
import { BackHeader } from '../src/components/BackHeader';
import { EmptyState } from '../src/components/EmptyState';
import { useAuthStore } from '../src/store/auth';

/**
 * Filtered contributor list — opened from "Search more X" on Resources.
 * No chips. Shows only the requested contributor type.
 * Sort: partner → nearest → featured → rest.
 */

const SECTIONS: Record<string, {
  label: string; subtitle: string; color: string; cats: string[];
}> = {
  church:        { label: 'Churches',   subtitle: 'Worship communities & local ministries', color: '#7C3AED', cats: ['church', 'ministry']     },
  therapy:       { label: 'Counseling', subtitle: 'Mental health & emotional support',      color: '#0284C7', cats: ['therapy']                },
  medical:       { label: 'Medical',    subtitle: 'Healthcare, clinics & wellness care',    color: '#059669', cats: ['medical']                },
  support_group: { label: 'Recovery',   subtitle: 'Addiction recovery & support groups',   color: '#D97706', cats: ['support_group']          },
  community:     { label: 'Outreach',   subtitle: 'Community service & nonprofits',         color: '#DC2626', cats: ['community', 'nonprofit'] },
};

const TYPE_LABEL: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', therapy: 'Counseling',
  medical: 'Medical', support_group: 'Recovery', community: 'Outreach', nonprofit: 'Outreach',
};

function typeColor(cat: string): string {
  if (['church', 'ministry'].includes(cat))     return '#7C3AED';
  if (cat === 'therapy')                        return '#0284C7';
  if (cat === 'medical')                        return '#059669';
  if (cat === 'support_group')                  return '#D97706';
  if (['community', 'nonprofit'].includes(cat)) return '#DC2626';
  return '#78716C';
}

// ── Org row card ───────────────────────────────────────────────────
function OrgListCard({ org }: { org: any }) {
  const initials    = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const location    = [org.city, org.state].filter(Boolean).join(', ');
  const color       = typeColor(org.category);
  const label       = TYPE_LABEL[org.category] ?? org.category;

  return (
    <TouchableOpacity
      style={[card.wrap, { borderLeftColor: color }]}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.75}
    >
      {org.logo_url ? (
        <Image source={{ uri: org.logo_url }} style={card.logo} />
      ) : (
        <View style={[card.logoFallback, { backgroundColor: color + '1A' }]}>
          <Text style={[card.logoText, { color }]}>{initials}</Text>
        </View>
      )}

      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{org.name}</Text>
          {org.is_partner && (
            <View style={card.partnerBadge}>
              <Text style={card.partnerText}>★ Partner</Text>
            </View>
          )}
          {!org.is_partner && org.is_featured && (
            <View style={[card.featuredBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
              <Text style={[card.featuredText, { color }]}>Featured</Text>
            </View>
          )}
          {org.is_verified && (
            <View style={[card.verified, { backgroundColor: color }]}>
              <Text style={card.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={card.metaRow}>
          <View style={[card.typeChip, { backgroundColor: color + '18' }]}>
            <Text style={[card.typeChipText, { color }]}>{label}</Text>
          </View>
          {location ? <Text style={card.location}>· {location}</Text> : null}
        </View>

        {org.short_description ? (
          <Text style={card.desc} numberOfLines={2}>{org.short_description}</Text>
        ) : null}
      </View>

      <Text style={card.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function BrowseContributorsScreen() {
  const { type = '' } = useLocalSearchParams<{ type: string }>();
  const { orgs, loading } = useOrganizations('', '');
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  const sec = SECTIONS[type];

  const sorted = useMemo(() => {
    if (!sec) return [];

    // 1. Type filter
    const typeFiltered = orgs.filter(o => sec.cats.includes(o.category));

    // 2. State-level distance filter
    const stateFiltered = !userState
      ? typeFiltered
      : typeFiltered.filter(o => !o.state || o.state.toLowerCase() === userState);

    // 3. Sort: partner → city → state → featured → name
    return [...stateFiltered].sort((a, b) => {
      if (a.is_partner !== b.is_partner) return b.is_partner ? 1 : -1;

      const aCity  = userCity  && a.city?.toLowerCase()  === userCity  ? 0 : 1;
      const bCity  = userCity  && b.city?.toLowerCase()  === userCity  ? 0 : 1;
      if (aCity !== bCity) return aCity - bCity;

      const aState = userState && a.state?.toLowerCase() === userState ? 0 : 1;
      const bState = userState && b.state?.toLowerCase() === userState ? 0 : 1;
      if (aState !== bState) return aState - bState;

      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [orgs, type, userCity, userState]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title={sec?.label ?? 'Contributors'} />

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
              {sec && <Text style={styles.subtitle}>{sec.subtitle}</Text>}
              <Text style={styles.sortNote}>
                {profile?.location_city
                  ? `Showing results near ${profile.location_city} · Partners first`
                  : 'Add your city in Profile to see local results first'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <OrgListCard org={item} />}
          ListEmptyComponent={
            <EmptyState
              title={`No ${sec?.label ?? 'contributors'} in your area`}
              subtitle="Try checking back soon or update your location in Profile"
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
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    borderLeftWidth: 4,
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  logo: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  logoFallback: {
    width: 48, height: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  logoText:  { fontSize: 14, fontWeight: '800' },
  info:      { flex: 1 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' },
  name:      { fontSize: 15, fontWeight: '700', color: '#1C1917', flex: 1 },
  partnerBadge: {
    backgroundColor: '#1A3A2A', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  partnerText:  { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  featuredBadge:{
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1,
  },
  featuredText: { fontSize: 10, fontWeight: '700' },
  verified: {
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeChip:  { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeChipText:{ fontSize: 11, fontWeight: '600' },
  location:  { fontSize: 12, color: '#78716C' },
  desc:      { fontSize: 12, color: '#78716C', lineHeight: 17 },
  chevron:   { fontSize: 20, color: '#C4B9AF', marginLeft: 8 },
});
