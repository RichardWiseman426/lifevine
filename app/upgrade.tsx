import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';
import { useMyOrgs } from '../src/hooks/useProfile';

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
  const { user } = useAuthStore();
  const { orgs, loading: orgsLoading } = useMyOrgs();

  // Orgs the user owns or admins
  const eligibleOrgs = orgs
    .filter((m: any) => m.role === 'owner' || m.role === 'admin')
    .map((m: any) => m.organizations)
    .filter(Boolean);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    eligibleOrgs.length === 1 ? eligibleOrgs[0].id : null
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function startUpgrade(tier: Tier) {
    if (tier.key === 'free') return; // free is the default — no action
    if (eligibleOrgs.length === 0) {
      Alert.alert(
        'No organization yet',
        'You need to be the owner or admin of an organization to upgrade. Apply to become a contributor first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply Now', onPress: () => router.push('/contributor-apply') },
        ]
      );
      return;
    }
    setSelectedTier(tier);
    if (eligibleOrgs.length === 1) setSelectedOrgId(eligibleOrgs[0].id);
    setPickerVisible(true);
  }

  async function submitRequest() {
    if (!selectedTier || !selectedOrgId || !user) return;
    const org = eligibleOrgs.find((o: any) => o.id === selectedOrgId);
    if (!org) return;

    setSubmitting(true);
    const { error } = await (supabase as any).from('tier_upgrade_requests').insert({
      org_id: selectedOrgId,
      user_id: user.id,
      current_tier: org.tier ?? 'free',
      requested_tier: selectedTier.key,
      notes: notes.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    setPickerVisible(false);
    setNotes('');
    Alert.alert(
      "You're on the list",
      `Thanks for your interest in the ${selectedTier.name} plan. We're finalizing billing setup and will reach out personally within a few days to get ${org.name} upgraded.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            Free works forever for getting started. Upgrade when you're ready to reach more people
            and unlock the tools to do it well.
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: '800' }}>Heads up:</Text> Billing isn't live just yet —
            we're finalizing setup. Tap "Get Started" to join the waitlist and we'll reach out
            personally to upgrade your organization.
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
                onPress={() => startUpgrade(tier)}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBtnText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Plans support the platform and let us keep LifeVine free for everyone seeking help.
            Cancel anytime. No hidden fees.
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPickerVisible(false)} disabled={submitting}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join the Waitlist</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {selectedTier && (
              <View style={[styles.summaryCard, { borderColor: selectedTier.accent }]}>
                <Text style={styles.summaryLabel}>Selected Plan</Text>
                <Text style={[styles.summaryTier, { color: selectedTier.accent }]}>
                  {selectedTier.name}
                </Text>
                <Text style={styles.summaryPrice}>
                  No payment required — we'll follow up with details.
                </Text>
              </View>
            )}

            {orgsLoading ? (
              <ActivityIndicator color="#2D6A4F" />
            ) : (
              <>
                <Text style={styles.fieldLabel}>For which organization?</Text>
                {eligibleOrgs.map((org: any) => {
                  const active = selectedOrgId === org.id;
                  return (
                    <TouchableOpacity
                      key={org.id}
                      style={[styles.orgPick, active && styles.orgPickActive]}
                      onPress={() => setSelectedOrgId(org.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.orgPickInfo}>
                        <Text style={styles.orgPickName}>{org.name}</Text>
                        <Text style={styles.orgPickTier}>
                          Currently: {String(org.tier ?? 'free').toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <Text style={styles.fieldLabel}>Anything we should know? (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Questions, special needs, timing…"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!selectedOrgId || submitting) && { opacity: 0.5 },
              ]}
              onPress={submitRequest}
              disabled={!selectedOrgId || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Join the Waitlist</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.modalFinePrint}>
              You won't be charged. We'll contact you personally to walk through billing once it's
              live.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  notice: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  noticeText: { fontSize: 13, color: '#92400E', lineHeight: 19 },

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
  badgeRibbonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

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

  ctaBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  ctaBtnDisabled: {
    backgroundColor: '#F5F0E8',
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  ctaBtnDisabledText: { color: '#A8A29E', fontSize: 14, fontWeight: '600' },

  footer: { padding: 22 },
  footerText: { fontSize: 12, color: '#A8A29E', textAlign: 'center', lineHeight: 18 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#FEFCF8' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
    backgroundColor: '#FFFFFF',
  },
  modalCancel: { fontSize: 15, color: '#A8A29E' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  modalScroll: { padding: 20, paddingBottom: 40 },

  summaryCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  summaryLabel: { fontSize: 11, color: '#A8A29E', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryTier: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  summaryPrice: { fontSize: 14, color: '#6B5E52' },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#78716C', marginBottom: 10, marginTop: 8 },

  orgPick: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  orgPickActive: { borderColor: '#2D6A4F', backgroundColor: '#E8F5E9' },
  orgPickInfo: { flex: 1 },
  orgPickName: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  orgPickTier: { fontSize: 12, color: '#A8A29E', marginTop: 2, fontWeight: '600', letterSpacing: 0.5 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#D4C4B0',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#2D6A4F' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D6A4F' },

  fieldInput: {
    borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#FFFFFF', color: '#1C1917',
  },
  fieldInputMulti: { minHeight: 100 },

  submitBtn: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  modalFinePrint: {
    fontSize: 12,
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
