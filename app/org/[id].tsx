import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  Linking, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useOrganization } from '../../src/hooks/useOrganizations';
import { startOrgConversation } from '../../src/hooks/useConversations';
import { useAuthStore } from '../../src/store/auth';
import { BackHeader } from '../../src/components/BackHeader';

const { width: SW } = Dimensions.get('window');
const GALLERY_IMG_W = SW * 0.62;
const GALLERY_IMG_H = GALLERY_IMG_W * 0.75;
const PASTOR_IMG_SIZE = 80;

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church',
  ministry: 'Ministry',
  support_group: 'Support Group',
  therapy: 'Therapy / Counseling',
  medical: 'Medical / Health',
  nonprofit: 'Nonprofit',
  community: 'Community Organization',
};

type OrgFull = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  short_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_verified: boolean;
  is_featured: boolean;
  tags: string[];
  gallery_urls: string[];
  contact_name: string | null;
  contact_title: string | null;
  denomination: string | null;
  mission_statement: string | null;
  service_times: string | null;
  services_offered: string[];
  practice_details: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_twitter: string | null;
  pastor_name: string | null;
  pastor_title: string | null;
  pastor_bio: string | null;
  pastor_image_url: string | null;
  donation_url: string | null;
};

function SocialButton({ icon, url }: { icon: string; url: string }) {
  return (
    <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(url)}>
      <Text style={styles.socialIcon}>{icon}</Text>
    </TouchableOpacity>
  );
}

export default function OrgDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { org: rawOrg, loading } = useOrganization(id);
  const org = rawOrg as OrgFull | null;
  const { user } = useAuthStore();
  const [messaging, setMessaging] = useState(false);

  async function handleMessage() {
    if (!user || !org) return;
    setMessaging(true);
    const convId = await startOrgConversation(user.id, org.id);
    setMessaging(false);
    if (convId) router.push(`/conversation/${convId}`);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackHeader title="" />
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (!org) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackHeader title="Organization" />
        <View style={styles.centered}>
          <Text style={styles.notFound}>Organization not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived display values ──────────────────────────────────────────────
  const streetLine = [org.address_line1, org.address_line2].filter(Boolean).join(', ');
  const cityLine = [org.city, org.state].filter(Boolean).join(', ');
  const postalLine = org.postal_code ?? null;
  const countryLine = org.country && org.country !== 'US' ? org.country : null;

  const gallery: string[] = (org.gallery_urls ?? []).filter(Boolean);
  const servicesOffered: string[] = (org.services_offered ?? []).filter(Boolean);

  const hasSocial = org.social_facebook || org.social_instagram || org.social_youtube || org.social_twitter;
  const hasPastor = org.pastor_name || org.pastor_title || org.pastor_bio || org.pastor_image_url;
  const hasContact = org.contact_name || org.phone || org.email || org.website_url;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title={org.name} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero banner + logo ──────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {org.banner_url ? (
            <Image source={{ uri: org.banner_url }} style={styles.banner} resizeMode="cover" />
          ) : (
            <View style={styles.bannerFallback} />
          )}
          <View style={styles.logoCircleWrap}>
            {org.logo_url ? (
              <Image source={{ uri: org.logo_url }} style={styles.logoCircleImg} />
            ) : (
              <View style={styles.logoCircleFallback}>
                <Text style={styles.logoCircleInitials}>{org.name.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Name + badges ──────────────────────────────────────────── */}
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{org.name}</Text>
            {org.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{CATEGORY_LABELS[org.category] ?? org.category}</Text>
            </View>
            {org.denomination ? (
              <View style={[styles.chip, styles.chipDenom]}>
                <Text style={[styles.chipText, styles.chipTextDenom]}>{org.denomination}</Text>
              </View>
            ) : null}
          </View>

          {/* Location summary under name */}
          {cityLine ? (
            <Text style={styles.locationLine}>📍 {cityLine}</Text>
          ) : null}
        </View>

        {/* ── Give + Message buttons ────────────────────────────────── */}
        <View style={styles.actionRow}>
          {org.donation_url ? (
            <TouchableOpacity
              style={styles.giveBtn}
              onPress={() => Linking.openURL(org.donation_url!)}
              activeOpacity={0.8}
            >
              <Text style={styles.giveBtnText}>💛  Give</Text>
            </TouchableOpacity>
          ) : null}

          {user ? (
            <TouchableOpacity
              style={[
                styles.messageBtn,
                messaging && styles.messageBtnDisabled,
                org.donation_url ? styles.messageBtnNarrow : null,
              ]}
              onPress={handleMessage}
              disabled={messaging}
              activeOpacity={0.8}
            >
              {messaging ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.messageBtnText}>✉️  Message</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Mission Statement ──────────────────────────────────────── */}
        {org.mission_statement ? (
          <View style={[styles.section, styles.missionSection]}>
            <Text style={styles.missionText}>"{org.mission_statement}"</Text>
          </View>
        ) : null}

        {/* ── About ─────────────────────────────────────────────────── */}
        {(org.description || org.short_description) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{org.description ?? org.short_description}</Text>
          </View>
        ) : null}

        {/* ── Services Offered ──────────────────────────────────────── */}
        {servicesOffered.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            <View style={styles.serviceChipGrid}>
              {servicesOffered.map((svc) => (
                <View key={svc} style={styles.serviceChip}>
                  <Text style={styles.serviceChipText}>{svc}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── About Our Approach (practice details) ─────────────────── */}
        {org.practice_details ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Our Approach</Text>
            <Text style={styles.body}>{org.practice_details}</Text>
          </View>
        ) : null}

        {/* ── Service Times ─────────────────────────────────────────── */}
        {org.service_times ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Times</Text>
            <Text style={styles.body}>{org.service_times}</Text>
          </View>
        ) : null}

        {/* ── Pastor / Leadership ───────────────────────────────────── */}
        {hasPastor ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leadership</Text>
            <View style={styles.pastorRow}>
              {org.pastor_image_url ? (
                <Image
                  source={{ uri: org.pastor_image_url }}
                  style={styles.pastorImg}
                />
              ) : (
                <View style={styles.pastorImgFallback}>
                  <Text style={styles.pastorImgInitials}>
                    {org.pastor_name
                      ? org.pastor_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                      : '✝'}
                  </Text>
                </View>
              )}
              <View style={styles.pastorInfo}>
                {org.pastor_name ? (
                  <Text style={styles.pastorName}>{org.pastor_name}</Text>
                ) : null}
                {org.pastor_title ? (
                  <Text style={styles.pastorTitle}>{org.pastor_title}</Text>
                ) : null}
              </View>
            </View>
            {org.pastor_bio ? (
              <Text style={[styles.body, { marginTop: 14 }]}>{org.pastor_bio}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Gallery ───────────────────────────────────────────────── */}
        {gallery.length > 0 ? (
          <View style={styles.gallerySectionWrap}>
            <Text style={styles.gallerySectionTitle}>Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
              decelerationRate="fast"
              snapToInterval={GALLERY_IMG_W + 12}
            >
              {gallery.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={[styles.galleryImg, { width: GALLERY_IMG_W, height: GALLERY_IMG_H }]}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Location / Address ────────────────────────────────────── */}
        {(streetLine || cityLine || postalLine || countryLine) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            {streetLine ? <Text style={styles.addressLine}>{streetLine}</Text> : null}
            {(cityLine || postalLine) ? (
              <Text style={styles.addressLine}>
                {[cityLine, postalLine].filter(Boolean).join('  ')}
              </Text>
            ) : null}
            {countryLine ? <Text style={styles.addressLine}>{countryLine}</Text> : null}
          </View>
        ) : null}

        {/* ── Contact ───────────────────────────────────────────────── */}
        {hasContact ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            {(org.contact_name || org.contact_title) ? (
              <View style={styles.contactPersonRow}>
                <View style={styles.contactPersonAvatar}>
                  <Text style={styles.contactPersonInitials}>
                    {org.contact_name
                      ? org.contact_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                      : '?'}
                  </Text>
                </View>
                <View>
                  {org.contact_name ? (
                    <Text style={styles.contactName}>{org.contact_name}</Text>
                  ) : null}
                  {org.contact_title ? (
                    <Text style={styles.contactTitleText}>{org.contact_title}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {org.phone ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${org.phone}`)}
              >
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactLink}>{org.phone}</Text>
              </TouchableOpacity>
            ) : null}

            {org.email ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${org.email}`)}
              >
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactLink}>{org.email}</Text>
              </TouchableOpacity>
            ) : null}

            {org.website_url ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(org.website_url!)}
              >
                <Text style={styles.contactIcon}>🌐</Text>
                <Text style={styles.contactLink}>{org.website_url}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Social Media ──────────────────────────────────────────── */}
        {hasSocial ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Find Us Online</Text>
            <View style={styles.socialRow}>
              {org.social_facebook ? (
                <SocialButton icon="📘" url={org.social_facebook} />
              ) : null}
              {org.social_instagram ? (
                <SocialButton icon="📸" url={org.social_instagram} />
              ) : null}
              {org.social_youtube ? (
                <SocialButton icon="▶️" url={org.social_youtube} />
              ) : null}
              {org.social_twitter ? (
                <SocialButton icon="🐦" url={org.social_twitter} />
              ) : null}
            </View>
            <View style={styles.socialLinksList}>
              {org.social_facebook ? (
                <TouchableOpacity onPress={() => Linking.openURL(org.social_facebook!)}>
                  <Text style={styles.socialLinkText} numberOfLines={1}>
                    Facebook — {org.social_facebook}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {org.social_instagram ? (
                <TouchableOpacity onPress={() => Linking.openURL(org.social_instagram!)}>
                  <Text style={styles.socialLinkText} numberOfLines={1}>
                    Instagram — {org.social_instagram}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {org.social_youtube ? (
                <TouchableOpacity onPress={() => Linking.openURL(org.social_youtube!)}>
                  <Text style={styles.socialLinkText} numberOfLines={1}>
                    YouTube — {org.social_youtube}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {org.social_twitter ? (
                <TouchableOpacity onPress={() => Linking.openURL(org.social_twitter!)}>
                  <Text style={styles.socialLinkText} numberOfLines={1}>
                    Twitter / X — {org.social_twitter}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Tags ──────────────────────────────────────────────────── */}
        {org.tags?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagRow}>
              {org.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const PASTOR_IMG = PASTOR_IMG_SIZE;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 15, color: '#A8A29E' },
  scroll: { paddingBottom: 56 },

  // ── Hero ──
  heroWrap: { position: 'relative', marginBottom: 52 },
  banner: { width: '100%', height: 170 },
  bannerFallback: { width: '100%', height: 140, backgroundColor: '#2D6A4F' },
  logoCircleWrap: {
    position: 'absolute', bottom: -44, left: 20,
    borderRadius: 44, overflow: 'hidden',
    borderWidth: 4, borderColor: '#F5F0E8',
    width: 88, height: 88,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  logoCircleImg: { width: 80, height: 80 },
  logoCircleFallback: {
    width: 80, height: 80, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  logoCircleInitials: { fontSize: 26, fontWeight: '800', color: '#2D6A4F' },

  // ── Name block ──
  nameBlock: { paddingHorizontal: 20, marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  name: { fontSize: 24, fontWeight: '800', color: '#1C1917', flex: 1, letterSpacing: -0.4 },
  verifiedBadge: {
    backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 3,
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipDenom: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 },
  chipText: { color: '#2D6A4F', fontSize: 13, fontWeight: '600' },
  chipTextDenom: { color: '#92400E' },
  locationLine: { fontSize: 13, color: '#78716C', marginBottom: 4 },

  // ── Sections ──
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 18, marginHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 12,
  },
  body: { fontSize: 15, color: '#57534E', lineHeight: 24 },

  // ── Action row (Give + Message) ──
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  giveBtn: {
    flex: 1,
    backgroundColor: '#B8864E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8864E',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  giveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  messageBtn: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6A4F',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  messageBtnNarrow: { flex: 1 },
  messageBtnDisabled: { opacity: 0.6 },
  messageBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  // ── Mission statement ──
  missionSection: {
    backgroundColor: '#F0FAF4',
    borderLeftWidth: 4, borderLeftColor: '#2D6A4F',
  },
  missionText: {
    fontSize: 16, color: '#1C1917', fontStyle: 'italic',
    lineHeight: 26, letterSpacing: 0.1,
  },

  // ── Services offered chips ──
  serviceChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    backgroundColor: '#EEF9F3', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#B6E5CA',
  },
  serviceChipText: { fontSize: 13, color: '#2D6A4F', fontWeight: '600' },

  // ── Pastor ──
  pastorRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pastorImg: {
    width: PASTOR_IMG, height: PASTOR_IMG, borderRadius: PASTOR_IMG / 2,
    borderWidth: 3, borderColor: '#E8F5E9',
  },
  pastorImgFallback: {
    width: PASTOR_IMG, height: PASTOR_IMG, borderRadius: PASTOR_IMG / 2,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#C8E6C9',
  },
  pastorImgInitials: { fontSize: 20, fontWeight: '800', color: '#2D6A4F' },
  pastorInfo: { flex: 1 },
  pastorName: { fontSize: 17, fontWeight: '800', color: '#1C1917' },
  pastorTitle: { fontSize: 13, color: '#78716C', marginTop: 3 },

  // ── Gallery ──
  gallerySectionWrap: { marginBottom: 12 },
  gallerySectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    textTransform: 'uppercase', letterSpacing: 1.4,
    paddingHorizontal: 16, marginBottom: 12,
  },
  galleryScroll: { paddingHorizontal: 16, gap: 12 },
  galleryImg: { borderRadius: 14, borderWidth: 1, borderColor: '#E5DDD4' },

  // ── Address ──
  addressLine: { fontSize: 15, color: '#57534E', lineHeight: 24 },

  // ── Contact ──
  contactPersonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F5F0E8',
  },
  contactPersonAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
  },
  contactPersonInitials: { color: '#2D6A4F', fontSize: 15, fontWeight: '800' },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1C1917' },
  contactTitleText: { fontSize: 13, color: '#78716C', marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  contactIcon: { fontSize: 17 },
  contactLink: { fontSize: 15, color: '#2D6A4F', flex: 1 },

  // ── Social ──
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  socialBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F5F0E8', borderWidth: 1, borderColor: '#E5DDD4',
    alignItems: 'center', justifyContent: 'center',
  },
  socialIcon: { fontSize: 20 },
  socialLinksList: { gap: 6 },
  socialLinkText: { fontSize: 13, color: '#2D6A4F' },

  // ── Tags ──
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#F5F0E8', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#E5DDD4',
  },
  tagText: { fontSize: 12, color: '#78716C' },
});
