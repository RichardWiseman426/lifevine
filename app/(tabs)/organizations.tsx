import { useState, useMemo, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, ScrollView, Dimensions,
  TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrganizations } from '../../src/hooks/useOrganizations';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useAuthStore } from '../../src/store/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const CATEGORIES = [
  { label: 'All',           value: ''             },
  { label: 'Church',        value: 'church'        },
  { label: 'Ministry',      value: 'ministry'      },
  { label: 'Counseling',    value: 'therapy'       },
  { label: 'Healthcare',    value: 'medical'       },
  { label: 'Support Group', value: 'support_group' },
  { label: 'Nonprofit',     value: 'nonprofit'     },
  { label: 'Community',     value: 'community'     },
];

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', therapy: 'Counseling',
  medical: 'Healthcare', support_group: 'Support Group',
  nonprofit: 'Nonprofit', community: 'Community Org',
};

// ── Local carousel card ──────────────────────────────────────────
function LocalCard({ org }: { org: any }) {
  const location = [org.city, org.state].filter(Boolean).join(', ');
  const initials = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[localCard.card, { width: CARD_WIDTH }]}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.85}
    >
      <View style={localCard.accent} />
      <View style={localCard.body}>
        <View style={localCard.topRow}>
          {/* Logo / initials */}
          {org.logo_url ? (
            <Image source={{ uri: org.logo_url }} style={localCard.logo} />
          ) : (
            <View style={localCard.logoFallback}>
              <Text style={localCard.logoText}>{initials}</Text>
            </View>
          )}
          <View style={localCard.badges}>
            <View style={localCard.chip}>
              <Text style={localCard.chipText}>
                {CATEGORY_LABELS[org.category] ?? org.category}
              </Text>
            </View>
            {org.is_verified && (
              <View style={localCard.verified}>
                <Text style={localCard.verifiedText}>✓</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={localCard.name} numberOfLines={2}>{org.name}</Text>
        {org.short_description ? (
          <Text style={localCard.desc} numberOfLines={2}>{org.short_description}</Text>
        ) : null}
        {location ? (
          <Text style={localCard.location}>{location}</Text>
        ) : null}
        <Text style={localCard.cta}>View organization →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main list card ───────────────────────────────────────────────
function OrgListCard({ org }: { org: any }) {
  const location = [org.city, org.state].filter(Boolean).join(', ');
  const initials = org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={listCard.card}
      onPress={() => router.push(`/org/${org.id}`)}
      activeOpacity={0.75}
    >
      {org.logo_url ? (
        <Image source={{ uri: org.logo_url }} style={listCard.logo} />
      ) : (
        <View style={listCard.logoFallback}>
          <Text style={listCard.logoText}>{initials}</Text>
        </View>
      )}
      <View style={listCard.info}>
        <View style={listCard.nameRow}>
          <Text style={listCard.name} numberOfLines={1}>{org.name}</Text>
          {org.is_verified && (
            <View style={listCard.verified}><Text style={listCard.verifiedText}>✓</Text></View>
          )}
        </View>
        <View style={listCard.metaRow}>
          <View style={listCard.chip}>
            <Text style={listCard.chipText}>{CATEGORY_LABELS[org.category] ?? org.category}</Text>
          </View>
          {location ? <Text style={listCard.location}>· {location}</Text> : null}
        </View>
        {org.short_description ? (
          <Text style={listCard.desc} numberOfLines={2}>{org.short_description}</Text>
        ) : null}
      </View>
      <Text style={listCard.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function OrganizationsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState(params.category ?? '');
  const [search, setSearch] = useState('');
  const { orgs, loading } = useOrganizations(search, category);
  const { profile } = useAuthStore();

  // If params.category changes (navigated from home shortcuts), update
  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  // Proximity sort: city → state → everything else
  const { localOrgs, sortedOrgs } = useMemo(() => {
    const userCity  = profile?.location_city?.toLowerCase() ?? '';
    const userState = profile?.location_state?.toLowerCase() ?? '';

    const rank = (o: any) => {
      if (userCity  && o.city?.toLowerCase()  === userCity)  return 0;
      if (userState && o.state?.toLowerCase() === userState) return 1;
      return 2;
    };

    const sorted = [...orgs].sort((a, b) => rank(a) - rank(b));
    const local  = sorted.filter(o => rank(o) === 0);
    return { localOrgs: local, sortedOrgs: sorted };
  }, [orgs, profile?.location_city, profile?.location_state]);

  const cityLabel = profile?.location_city ?? 'your area';
  const catChipLabel = CATEGORIES.find(c => c.value === category)?.label ?? 'All';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Contributors"
        subtitle="Churches, counseling, healthcare & more"
      />

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
          data={sortedOrgs}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}

          ListHeaderComponent={
            <View style={styles.headerSection}>
              {/* Location nudge — shown only when city not set */}
              {!profile?.location_city && (
                <TouchableOpacity
                  style={styles.locationNudge}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.locationNudgeText}>
                    Add your city in Profile to see content near you
                  </Text>
                  <Text style={styles.locationNudgeArrow}>→</Text>
                </TouchableOpacity>
              )}

              {/* Search bar */}
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search organizations…"
                  placeholderTextColor="#A8A29E"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Near You */}
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionLabel}>NEAR YOU</Text>
                <Text style={styles.sectionSub}>{cityLabel}</Text>
              </View>

              {localOrgs.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselRow}
                  decelerationRate="fast"
                  snapToInterval={CARD_WIDTH + 12}
                >
                  {localOrgs.map((org) => (
                    <LocalCard key={org.id} org={org} />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.carouselEmpty}>
                  <Text style={styles.carouselEmptyText}>
                    {profile?.location_city
                      ? `No ${catChipLabel !== 'All' ? catChipLabel.toLowerCase() + 's' : 'organizations'} in ${profile.location_city} yet.`
                      : 'Add your city in Profile to see local organizations.'}
                  </Text>
                </View>
              )}

              {/* All section heading */}
              <View style={styles.allHeadRow}>
                <Text style={styles.sectionLabel}>
                  {category ? `ALL ${catChipLabel.toUpperCase()}S` : 'ALL ORGANIZATIONS'}
                </Text>
                <Text style={styles.sectionSub}>Closest first</Text>
              </View>
            </View>
          }

          renderItem={({ item }) => <OrgListCard org={item} />}

          ListEmptyComponent={
            <EmptyState
              title="No organizations found"
              subtitle="Try a different category or search term"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },

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

  headerSection: { paddingTop: 8, paddingBottom: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    marginHorizontal: 16, marginBottom: 20,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1917', paddingVertical: 0 },

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

  carouselRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  locationNudge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12, borderWidth: 1, borderColor: '#C8E6C9',
  },
  locationNudgeText: { fontSize: 13, color: '#2D6A4F', fontWeight: '600', flex: 1 },
  locationNudgeArrow: { fontSize: 16, color: '#2D6A4F', marginLeft: 8 },
  carouselEmpty: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#E5DDD4',
    padding: 20, alignItems: 'center',
  },
  carouselEmptyText: { fontSize: 13, color: '#A8A29E', textAlign: 'center', lineHeight: 20 },

  list: { paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Local carousel card styles ────────────────────────────────────
const localCard = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  accent: { height: 5, backgroundColor: '#2D6A4F' },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  logoFallback: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 14, fontWeight: '800', color: '#2D6A4F' },
  badges: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#E2F0E8', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#C6DFD0',
  },
  chipText: { fontSize: 11, color: '#2D6A4F', fontWeight: '700' },
  verified: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 5, letterSpacing: -0.2, lineHeight: 22 },
  desc: { fontSize: 13, color: '#78716C', lineHeight: 19, marginBottom: 8 },
  location: { fontSize: 12, color: '#A8A29E', marginBottom: 14 },
  cta: { fontSize: 13, color: '#2D6A4F', fontWeight: '700', borderTopWidth: 1, borderTopColor: '#F0EBE4', paddingTop: 12 },
});

// ── List card styles ──────────────────────────────────────────────
const listCard = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 10,
    padding: 14,
    borderWidth: 1, borderColor: '#E5DDD4',
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  logo: { width: 52, height: 52, borderRadius: 12, marginRight: 12 },
  logoFallback: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  logoText: { fontSize: 16, fontWeight: '800', color: '#2D6A4F' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  name: { fontSize: 15, fontWeight: '700', color: '#1C1917', flex: 1 },
  verified: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  chip: {
    backgroundColor: '#E8F5E9', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  chipText: { fontSize: 11, color: '#2D6A4F', fontWeight: '600' },
  location: { fontSize: 12, color: '#A8A29E' },
  desc: { fontSize: 12, color: '#78716C', lineHeight: 17 },
  chevron: { fontSize: 22, color: '#D4C4B0', marginLeft: 8 },
});
