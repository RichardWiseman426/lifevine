import { useMemo } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useOpportunities } from '../src/hooks/useOpportunities';
import { OpportunityCard } from '../src/components/OpportunityCard';
import { BackHeader } from '../src/components/BackHeader';
import { EmptyState } from '../src/components/EmptyState';
import { useAuthStore } from '../src/store/auth';

/**
 * Filtered opportunity list — opened from "Search more X" on Get Involved.
 * No category chips. Shows only the requested category.
 * Sort: partner-org → nearest → featured → rest.
 */

const LABELS: Record<string, { label: string; subtitle: string }> = {
  volunteer:      { label: 'Volunteer',        subtitle: 'Hands-on opportunities to serve'       },
  service:        { label: 'Service',           subtitle: 'Meet practical community needs'        },
  community_need: { label: 'Community Needs',   subtitle: 'Help where it matters most'            },
  prayer:         { label: 'Prayer',            subtitle: 'Stand in the gap for others'           },
  mentorship:     { label: 'Mentorship',        subtitle: "Invest in someone's growth"            },
  fundraising:    { label: 'Fundraising',       subtitle: 'Support a cause with a donation'       },
};

export default function BrowseOpportunitiesScreen() {
  const { category = '' } = useLocalSearchParams<{ category: string }>();
  const { opportunities, loading } = useOpportunities(''); // load all, filter below
  const { profile } = useAuthStore();

  const userCity  = profile?.location_city?.toLowerCase()  ?? '';
  const userState = profile?.location_state?.toLowerCase() ?? '';

  const sorted = useMemo(() => {
    // 1. Category filter
    const catFiltered = opportunities.filter(o => o.category === category);

    // 2. State-level distance filter
    const stateFiltered = !userState
      ? catFiltered
      : catFiltered.filter(o => o.is_remote || !o.state || o.state.toLowerCase() === userState);

    // 3. Sort: partner-org → city → state → remote → featured → rest
    return [...stateFiltered].sort((a, b) => {
      const aP = (a.organizations as any)?.is_partner ?? false;
      const bP = (b.organizations as any)?.is_partner ?? false;
      if (aP !== bP) return bP ? 1 : -1;

      const aCity  = userCity  && a.city?.toLowerCase()  === userCity  ? 0 : 1;
      const bCity  = userCity  && b.city?.toLowerCase()  === userCity  ? 0 : 1;
      if (aCity !== bCity) return aCity - bCity;

      const aState = userState && a.state?.toLowerCase() === userState ? 0 : 1;
      const bState = userState && b.state?.toLowerCase() === userState ? 0 : 1;
      if (aState !== bState) return aState - bState;

      if (a.is_remote !== b.is_remote) return a.is_remote ? -1 : 1;
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return 0;
    });
  }, [opportunities, category, userCity, userState]);

  const meta = LABELS[category] ?? { label: category, subtitle: '' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title={meta.label} />

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
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
              <Text style={styles.sortNote}>
                {profile?.location_city
                  ? `Showing results near ${profile.location_city} · Partners first`
                  : 'Add your city in Profile to see local results first'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <OpportunityCard
              opportunity={item}
              onPress={() => router.push(`/opportunity/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={`No ${meta.label} right now`}
              subtitle="Check back soon — new opportunities are added regularly"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F5F0E8' },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:    { paddingBottom: 48 },
  listHead:{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  subtitle:{ fontSize: 15, color: '#1C1917', fontWeight: '600', marginBottom: 4 },
  sortNote:{ fontSize: 12, color: '#A8A29E' },
});
