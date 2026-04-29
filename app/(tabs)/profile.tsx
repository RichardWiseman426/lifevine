import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth';
import { useSettingsStore, AffirmationPosition } from '../../src/store/settings';
import { supabase } from '../../src/lib/supabase';
// Note: skipIntentGate removed — intent gate no longer exists in the app.
import { useMyOrgs, useUpdateProfile } from '../../src/hooks/useProfile';
import { useDrawerStore } from '../../src/store/drawer';
import { pickAndUploadImage } from '../../src/lib/storage';
import { HOME_CATEGORIES } from './index';

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', support_group: 'Support Group',
  therapy: 'Therapy', medical: 'Medical', nonprofit: 'Nonprofit', community: 'Community',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', contributor: 'Member',
};

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuthStore();
  const {
    homeCarouselCategory, setHomeCarouselCategory,
    showDailyAffirmation, setShowDailyAffirmation,
    affirmationPosition, setAffirmationPosition,
  } = useSettingsStore();
  const { orgs, loading: orgsLoading } = useMyOrgs();
  const { updateProfile, saving } = useUpdateProfile();
  const { open } = useDrawerStore();

  const [editVisible, setEditVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [uploading, setUploading] = useState(false);

  const isAdmin = profile?.platform_role === 'super_admin' || profile?.platform_role === 'moderator';

  // A contributor is anyone who owns or admins at least one org
  const isContributor = orgs.some((m: any) => m.role === 'owner' || m.role === 'admin');

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all personal data. Your testimonies will remain but become anonymous. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation — Apple requires the user can't accidentally delete
            Alert.alert(
              'Are you absolutely sure?',
              'Your account will be permanently deleted. There is no way to recover it.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Forever',
                  style: 'destructive',
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  }

  async function confirmDeleteAccount() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      Alert.alert('Error', 'Could not verify your session. Please sign in again.');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert('Error', body.error ?? 'Account deletion failed. Please try again.');
        return;
      }

      // Edge function deleted the auth user — sign out clears local session
      await signOut();
    } catch {
      Alert.alert('Error', 'Could not connect. Check your internet and try again.');
    }
  }

  async function handleAvatarUpload() {
    if (!user) return;
    setUploading(true);
    const { url, error } = await pickAndUploadImage('avatars', `${user.id}/avatar.jpg`);
    if (error) {
      Alert.alert('Upload Error', error);
    } else if (url) {
      await updateProfile({ avatar_url: url });
    }
    setUploading(false);
  }

  async function handleSave() {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      Alert.alert('Required', 'First name is required.');
      return;
    }
    const displayName = last ? `${first} ${last}` : first;
    const { error } = await updateProfile({
      first_name: first,
      last_name: last || undefined,
      display_name: displayName,
      bio: bio.trim() || undefined,
      location_city: locationCity.trim() || undefined,
      location_state: locationState.trim() || undefined,
    });
    if (error) {
      Alert.alert('Error', error);
    } else {
      setEditVisible(false);
    }
  }

  function openEdit() {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setBio(profile?.bio ?? '');
    setLocationCity(profile?.location_city ?? '');
    setLocationState(profile?.location_state ?? '');
    setEditVisible(true);
  }

  const initials = (profile?.display_name ?? profile?.username ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  const locationLabel = [profile?.location_city, profile?.location_state]
    .filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={open} style={styles.hamburger} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.hamLine} />
            <View style={[styles.hamLine, { width: 13 }]} />
            <View style={styles.hamLine} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          {/* Avatar */}
          <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarWrap} activeOpacity={0.85} disabled={uploading}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              {uploading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.cameraIcon}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          {/* Name + badges */}
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile?.display_name ?? 'Your Profile'}</Text>
            {isContributor && (
              <View style={styles.contributorBadge}>
                <Text style={styles.contributorBadgeText}>Contributor</Text>
              </View>
            )}
          </View>

          {profile?.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
          {locationLabel ? (
            <Text style={styles.locationLabel}>{locationLabel}</Text>
          ) : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── My Organizations ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Organizations</Text>
          {orgsLoading ? (
            <ActivityIndicator color="#2D6A4F" style={{ marginVertical: 16 }} />
          ) : orgs.length === 0 ? (
            <View style={styles.emptyOrgsBox}>
              <Text style={styles.emptyOrgsText}>You haven't joined any organizations yet.</Text>
              <TouchableOpacity onPress={() => router.push('/contributor-apply')} style={styles.becomeContribBtn}>
                <Text style={styles.becomeContribText}>Become a Contributor →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orgs.map((m: any) => {
              const org = m.organizations;
              if (!org) return null;
              const canEdit = m.role === 'owner' || m.role === 'admin';
              const locationStr = [org.city, org.state].filter(Boolean).join(', ');

              return (
                <View key={org.id} style={styles.orgRow}>
                  <TouchableOpacity
                    style={styles.orgRowMain}
                    onPress={() => router.push(`/org/${org.id}`)}
                    activeOpacity={0.75}
                  >
                    {org.logo_url ? (
                      <Image source={{ uri: org.logo_url }} style={styles.orgLogoImg} />
                    ) : (
                      <View style={styles.orgLogoFallback}>
                        <Text style={styles.orgLogoText}>{org.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.orgInfo}>
                      <View style={styles.orgNameRow}>
                        <Text style={styles.orgName} numberOfLines={1}>{org.name}</Text>
                        {org.is_verified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.orgMeta} numberOfLines={1}>
                        {CATEGORY_LABELS[org.category] ?? org.category}
                        {locationStr ? ` · ${locationStr}` : ''}
                      </Text>
                      <Text style={styles.orgRole}>{ROLE_LABELS[m.role] ?? m.role}</Text>
                    </View>
                    <Text style={styles.orgChevron}>›</Text>
                  </TouchableOpacity>

                  {canEdit && (
                    <View style={styles.orgBtnRow}>
                      <TouchableOpacity
                        style={styles.orgEditBtn}
                        onPress={() => router.push(`/org-edit/${org.id}`)}
                      >
                        <Text style={styles.orgEditBtnText}>Edit Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.orgManageBtn}
                        onPress={() => router.push(`/manage-org/${org.id}`)}
                      >
                        <Text style={styles.orgManageBtnText}>Manage</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── Upgrade Plan (contributors only) ── */}
        {isContributor && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.85}
          >
            <View style={styles.upgradeIconWrap}>
              <View style={styles.upgradeIconDot} />
            </View>
            <View style={styles.upgradeTextWrap}>
              <Text style={styles.upgradeTitle}>Upgrade Your Organization</Text>
              <Text style={styles.upgradeSub}>
                Unlock featured placement, unlimited events, and more.
              </Text>
            </View>
            <Text style={styles.upgradeChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>

        {/* ── Home Screen ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Screen</Text>

          <Text style={styles.prefTitle}>Featured Section</Text>
          <Text style={styles.prefSub}>Choose what appears in your home screen carousel.</Text>
          <View style={styles.categoryGrid}>
            {HOME_CATEGORIES.map((cat) => {
              const active = homeCarouselCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => setHomeCarouselCategory(cat.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.prefRow, { marginTop: 20 }]}>
            <View style={styles.prefText}>
              <Text style={styles.prefTitle}>Daily Affirmation</Text>
              <Text style={styles.prefSub}>Show an encouraging message on your home screen.</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDailyAffirmation(!showDailyAffirmation)}
              style={[styles.toggle, showDailyAffirmation && styles.toggleOn]}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, showDailyAffirmation && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {showDailyAffirmation && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.prefSub, { marginBottom: 8 }]}>Affirmation position</Text>
              <View style={styles.segmentRow}>
                {(['top', 'bottom'] as AffirmationPosition[]).map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.segment, affirmationPosition === pos && styles.segmentActive]}
                    onPress={() => setAffirmationPosition(pos)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, affirmationPosition === pos && styles.segmentTextActive]}>
                      {pos === 'top' ? 'Top' : 'Bottom'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {isAdmin && (
            <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/admin')}>
              <Text style={styles.menuRowText}>Admin Dashboard</Text>
              <Text style={styles.menuRowChevron}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut}>
            <Text style={styles.menuRowTextDanger}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleDeleteAccount}>
            <Text style={styles.menuRowTextDelete}>Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.4 }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">

            {/* Profile photo hint */}
            <View style={styles.photoHint}>
              <Text style={styles.photoHintText}>
                To update your profile photo, tap your avatar on the profile screen.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              maxLength={60}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              maxLength={60}
              autoCapitalize="words"
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={locationCity}
                  onChangeText={setLocationCity}
                  placeholder="Dallas"
                  maxLength={80}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldHalfNarrow}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={locationState}
                  onChangeText={setLocationState}
                  placeholder="TX"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              value={bio}
              onChangeText={setBio}
              placeholder="A few words about yourself…"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingBottom: 56 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  topTitle: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  hamburger: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    gap: 4, borderWidth: 1, borderColor: '#E5DDD4',
  },
  hamLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: '#1C1917' },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  avatarWrap: { marginBottom: 14, position: 'relative' },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2D6A4F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F5F0E8',
  },
  cameraIcon: { fontSize: 13 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  displayName: { fontSize: 22, fontWeight: '800', color: '#1C1917' },
  contributorBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  contributorBadgeText: { fontSize: 11, color: '#92400E', fontWeight: '700' },

  username: { fontSize: 14, color: '#A8A29E', marginBottom: 4 },
  locationLabel: { fontSize: 13, color: '#78716C', marginBottom: 6, fontWeight: '500' },
  bio: {
    fontSize: 14, color: '#57534E', textAlign: 'center',
    lineHeight: 20, marginBottom: 12, paddingHorizontal: 16,
  },
  editBtn: {
    borderWidth: 1.5, borderColor: '#2D6A4F', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 26, marginTop: 4,
  },
  editBtnText: { color: '#2D6A4F', fontWeight: '700', fontSize: 14 },

  // Section card
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 14,
  },

  // Empty orgs
  emptyOrgsBox: { alignItems: 'center', paddingVertical: 12 },
  emptyOrgsText: { fontSize: 14, color: '#A8A29E', textAlign: 'center', marginBottom: 12 },
  becomeContribBtn: {
    borderWidth: 1.5, borderColor: '#2D6A4F', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  becomeContribText: { color: '#2D6A4F', fontWeight: '700', fontSize: 13 },

  // Org row
  orgRow: {
    borderBottomWidth: 1, borderBottomColor: '#F5F0E8',
    paddingVertical: 10,
  },
  orgRowMain: { flexDirection: 'row', alignItems: 'center' },
  orgLogoImg: {
    width: 44, height: 44, borderRadius: 10,
    marginRight: 12, borderWidth: 1, borderColor: '#E5DDD4',
  },
  orgLogoFallback: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  orgLogoText: { color: '#2D6A4F', fontSize: 14, fontWeight: '800' },
  orgInfo: { flex: 1 },
  orgNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgName: { fontSize: 15, fontWeight: '700', color: '#1C1917', flex: 1 },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  orgMeta: { fontSize: 12, color: '#A8A29E', marginTop: 1 },
  orgRole: {
    fontSize: 11, color: '#2D6A4F', fontWeight: '700',
    marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  orgChevron: { fontSize: 22, color: '#D4C4B0', marginLeft: 8 },
  orgBtnRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  orgEditBtn: {
    borderWidth: 1.5, borderColor: '#2D6A4F', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 14,
  },
  orgEditBtnText: { color: '#2D6A4F', fontSize: 12, fontWeight: '700' },
  orgManageBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 14,
  },
  orgManageBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Preferences
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prefText: { flex: 1 },
  prefTitle: { fontSize: 14, fontWeight: '600', color: '#1C1917', marginBottom: 2 },
  prefSub: { fontSize: 12, color: '#A8A29E', lineHeight: 17 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#E5DDD4', justifyContent: 'center', padding: 2, flexShrink: 0,
  },
  toggleOn: { backgroundColor: '#2D6A4F' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  catChip: {
    borderWidth: 1.5, borderColor: '#D4C4B0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEFCF8',
  },
  catChipActive: { borderColor: '#2D6A4F', backgroundColor: '#E8F5E9' },
  catChipText: { fontSize: 13, color: '#6B5E52', fontWeight: '500' },
  catChipTextActive: { color: '#2D6A4F', fontWeight: '700' },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, borderWidth: 1.5, borderColor: '#D4C4B0', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center', backgroundColor: '#FEFCF8',
  },
  segmentActive: { borderColor: '#2D6A4F', backgroundColor: '#E8F5E9' },
  segmentText: { fontSize: 14, color: '#6B5E52', fontWeight: '500' },
  segmentTextActive: { color: '#2D6A4F', fontWeight: '700' },

  // Account menu rows
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F0E8',
  },
  menuRowText: { fontSize: 15, color: '#1C1917', fontWeight: '500' },
  menuRowChevron: { fontSize: 20, color: '#D4C4B0' },
  menuRowTextDanger: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
  menuRowTextDelete: { fontSize: 15, color: '#9B1C1C', fontWeight: '500' },

  // Upgrade card
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 14,
  },
  upgradeIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeIconDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#B8864E' },
  upgradeTextWrap: { flex: 1 },
  upgradeTitle: { fontSize: 15, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  upgradeSub: { fontSize: 12, color: '#B8864E', lineHeight: 17 },
  upgradeChevron: { fontSize: 22, color: '#B8864E' },

  // Edit modal
  modalSafe: { flex: 1, backgroundColor: '#FEFCF8' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
    backgroundColor: '#FFFFFF',
  },
  modalCancel: { fontSize: 15, color: '#A8A29E' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  modalSave: { fontSize: 15, color: '#2D6A4F', fontWeight: '700' },
  modalScroll: { padding: 20 },

  photoHint: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 8,
  },
  photoHintText: { fontSize: 13, color: '#166534', lineHeight: 18 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#78716C', marginBottom: 6, marginTop: 16 },
  fieldInput: {
    borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#FFFFFF', color: '#1C1917',
  },
  fieldInputMulti: { minHeight: 100 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  fieldHalfNarrow: { width: 72 },
  charCount: { fontSize: 12, color: '#A8A29E', textAlign: 'right', marginTop: 4 },
});
