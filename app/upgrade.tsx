import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ── Upgrade page hosted on GitHub Pages.
// ── When a custom domain is live, swap to: 'https://lifevine.app/upgrade'
const UPGRADE_URL = 'https://ricwis426.github.io/lifevine/upgrade.html';

type TierKey = 'free' | 'enhanced' | 'partner';

type Tier = {
  key: TierKey;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  badge?: string;
  accent: string;
  accentSoft: string;
  features: string[];
};

const TIERS: Tier[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'always',
    tagline: 'Get listed. Reach your community.',
    accent: '#2D6A4F',
    accentSoft: '#E8F5E9',
    features: [
      'Public organization profile',
      'Photo gallery',
      '1 active event',
      '1 active opportunity',
      '1 team member',
      'Direct messaging with members',
      'Listed in browse & search',
    ],
  },
  {
    key: 'enhanced',
    name: 'Enhanced',
    price: '$49',
    cadence: 'per month',
    tagline: 'Built for active ministries.',
    badge: 'MOST POPULAR',
    accent: '#B8864E',
    accentSoft: '#FEF3C7',
    features: [
      'Everything in Free',
      'Up to 3 active events',
      'Up to 3 active opportunities',
      'Up to 5 team members',
      'Featured contributor placement',
      'Donation link on profile',
    ],
  },
  {
    key: 'partner',
    name: 'Partner',
    price: '$99',
    cadence: 'per month',
    tagline: 'For established organizations.',
    accent: '#7C3AED',
    accentSoft: '#EDE9FE',
    features: [
      'Everything in Enhanced',
      'Up to 25 team members',
      'Promoted slots on Home & Explore',
      'Verified Partner badge',
      'Custom category spotlight',
      'Direct line to LifeVine team',
    ],
  },
];

export default function UpgradeScreen() {
  function handleUpgrade(tier: Tier) {
    if (tier.key === 'free') return;

    const subject = encodeURIComponent(
      `LifeVine ${tier.name} Plan — Upgrade Request`
    );
    const body = encodeURIComponent(
      `Hi LifeVine team,\n\nI'd like to upgrade to the ${tier.name} plan (${tier.price}/${tier.cadence}).\n\nOrganization name: \nContact name: \nBest email: \n\nAnything we should know:\n`
    );

    const url = UPGRADE_URL.startsWith('mailto')
      ? `${UPGRADE_URL}?subject=${subject}&body=${body}`
      : `${UPGRADE_URL}?plan=${tier.key}`;

    Linking.openURL(url).catch(() =>
      Alert.alert(
        'Could not open',
        'Please email hello@lifevine.app to request an upgrade.'
      )
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Grow what you're building.</Text>
          <Text style={styles.introSub}>
            Free works forever for getting started. Upgrade when you're ready to
            reach more people and unlock the tools to do it well.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howLabel}>HOW UPGRADING WORKS</Text>
          <Text style={styles.howBody}>
            Tap "Get Started" and you'll be taken to our upgrade page where
            you can submit your request. Our team will reach out personally
            to get everything set up — usually within one business day.
          </Text>
        </View>

        {TIERS.map((tier) => (
          <View
            key={tier.key}
            style={[
              styles.tierCard,
              tier.badge ? styles.tierCardFeatured : null,
              tier.badge ? { borderColor: tier.accent } : null,
            ]}
          >
            {tier.badge && (
              <View style={[styles.badgeRibbon, { backgroundColor: tier.accent }]}>
                <Text style={styles.badgeRibbonText}>{tier.badge}</Text>
              </View>
            )}

            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.tierPrice, { color: tier.accent }]}>{tier.price}</Text>
                <Text style={styles.tierCadence}>/{tier.cadence}</Text>
              </View>
              <Text style={styles.tierTagline}>{tier.tagline}</Text>
            </View>

            <View style={[styles.featureDivider, { backgroundColor: tier.accentSoft }]} />

            <View style={styles.featureList}>
              {tier.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={[styles.checkDot, { backgroundColor: tier.accentSoft }]}>
                    <Text style={[styles.checkMark, { color: tier.accent }]}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {tier.key === 'free' ? (
              <View style={[styles.ctaBtn, styles.ctaBtnDisabled]}>
                <Text style={styles.ctaBtnDisabledText}>Your default plan</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: tier.accent }]}
                onPress={() => handleUpgrade(tier)}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBtnText}>Get Started →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Plans support the platform and let us keep LifeVine free for
            everyone seeking help. Cancel anytime. No hidden fees.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingBottom: 56 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DDD4',
    backgroundColor: '#FEFCF8',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 60 },
  backChevron: { fontSize: 26, color: '#2D6A4F', marginRight: 2, marginTop: -2 },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1917' },

  intro: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12 },
  introTitle: { fontSize: 24, fontWeight: '800', color: '#1C1917', marginBottom: 6 },
  introSub: { fontSize: 14, color: '#6B5E52', lineHeight: 21 },

  howItWorks: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  howLabel: {
    fontSize: 10, fontWeight: '800', color: '#166534',
    letterSpacing: 1.2, marginBottom: 6,
  },
  howBody: { fontSize: 13, color: '#166534', lineHeight: 20 },

  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    position: 'relative',
  },
  tierCardFeatured: {
    borderWidth: 2,
    shadowColor: '#1C1917',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badgeRibbon: {
    position: 'absolute',
    top: -10,
    right: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeRibbonText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  tierHeader: { marginBottom: 16 },
  tierName: { fontSize: 20, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  tierPrice: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  tierCadence: { fontSize: 14, color: '#A8A29E', marginLeft: 4 },
  tierTagline: { fontSize: 13, color: '#6B5E52', fontStyle: 'italic' },

  featureDivider: { height: 1, marginBottom: 16 },

  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 13, fontWeight: '800' },
  featureText: { flex: 1, fontSize: 14, color: '#1C1917', lineHeight: 20 },

  ctaBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  ctaBtnDisabled: {
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  ctaBtnDisabledText: { color: '#A8A29E', fontSize: 14, fontWeight: '600' },

  footer: { padding: 22 },
  footerText: { fontSize: 12, color: '#A8A29E', textAlign: 'center', lineHeight: 18 },
});
