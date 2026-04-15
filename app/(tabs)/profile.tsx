import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth';
import { useSettingsStore } from '../../src/store/settings';
import { useMyOrgs, useUpdateProfile } from '../../src/hooks/useProfile';
import { useDrawerStore } from '../../src/store/drawer';

const CATEGORY_LABELS: Record<string, string> = {
  church: 'Church', ministry: 'Ministry', support_group: 'Support Group',
  therapy: 'Therapy', medical: 'Medical', nonprofit: 'Nonprofit', community: 'Community',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', contributor: 'Member',
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { skipIntentGate, setSkipIntentGate } = useSettingsStore();
  const { orgs, loading: orgsLoading } = useMyOrgs();
  const { updateProfile, saving } = useUpdateProfile();
  const { open } = useDrawerStore();

  const [editVisible, setEditVisible] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const isSuperAdmin = profile?.platform_role === 'super_admin';

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleSave() {
    if (displayName.trim().length < 1) return;
    const { error } = await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || undefined,
    });
    if (error) {
      Alert.alert('Error', error);
    } else {
      setEditVisible(false);
    }
  }

  function openEdit() {
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
    setEditVisible(true);
  }

  const initials = (profile?.display_name ?? profile?.username ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Top bar with hamburger */}
        <View style={styles.profileTopBar}>
          <Text style={styles.profileTopTitle}>Profile</Text>
          <TouchableOpacity onPress={open} style={styles.profileHamburger} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <View style={styles.hamLine} />
            <View style={[styles.hamLine, {width: 13}]} />
            <View style={styles.hamLine} />
          </TouchableOpacity>
        </View>

        {/* Avatar + name */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{profile?.display_name ?? 'Your Profile'}</Text>
          {profile?.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Organizations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Organizations</Text>
          {orgsLoading ? (
            <ActivityIndicator color="#2D6A4F" style={{ marginVertical: 16 }} />
          ) : orgs.length === 0 ? (
            <Text style={styles.emptyText}>You haven't joined any organizations yet.</Text>
          ) : (
            orgs.map((m: any) => {
              const org = m.organizations;
              if (!org) return null;
              const location = [org.city, org.state].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  key={org.id}
                  style={styles.orgRow}
                  onPress={() => router.push(`/org/${org.id}`)}
                >
                  <View style={styles.orgAvatar}>
                    <Text style={styles.orgAvatarText}>{org.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.orgInfo}>
                    <View style={styles.orgNameRow}>
                      <Text style={styles.orgName}>{org.name}</Text>
                      {org.is_verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.orgMeta}>
                      {CATEGORY_LABELS[org.category] ?? org.category}
                      {location ? ` · ${location}` : ''}
                    </Text>
                    <Text style={styles.orgRole}>{ROLE_LABELS[m.role] ?? m.role}</Text>
                  </View>
                  <Text style={styles.orgChevron}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.prefRow}>
            <View style={styles.prefText}>
              <Text style={styles.prefTitle}>Skip intent screen on login</Text>
              <Text style={styles.prefSub}>Go straight to the app without being asked what you need.</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSkipIntentGate(!skipIntentGate)}
              style={[styles.toggle, skipIntentGate && styles.toggleOn]}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, skipIntentGate && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/conversations')}
          >
            <Text style={styles.menuRowText}>💬  Messages</Text>
            <Text style={styles.menuRowChevron}>›</Text>
          </TouchableOpacity>

          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/admin')}
            >
              <Text style={styles.menuRowText}>🛡️  Moderation</Text>
              <Text style={styles.menuRowChevron}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
            <Text style={styles.menuRowTextDanger}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
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
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              maxLength={80}
            />

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
  scroll: { padding: 20, paddingBottom: 48 },

  profileTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8 },
  profileTopTitle: { fontSize: 20, fontWeight: '700', color: '#1C1917' },
  profileHamburger: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#E5DDD4' },
  hamLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: '#1C1917' },

  heroSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  username: { fontSize: 14, color: '#888', marginBottom: 8 },
  bio: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 20 },
  editBtn: {
    borderWidth: 1.5, borderColor: '#2D6A4F', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 24, marginTop: 4,
  },
  editBtnText: { color: '#2D6A4F', fontWeight: '700', fontSize: 14 },

  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center', paddingVertical: 12 },

  orgRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  orgAvatar: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  orgAvatarText: { color: '#2D6A4F', fontSize: 14, fontWeight: '800' },
  orgInfo: { flex: 1 },
  orgNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  verifiedBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  orgMeta: { fontSize: 12, color: '#888', marginTop: 1 },
  orgRole: { fontSize: 11, color: '#2D6A4F', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  orgChevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },

  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prefText: { flex: 1 },
  prefTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  prefSub: { fontSize: 12, color: '#888', lineHeight: 17 },
  toggle: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#ddd', justifyContent: 'center', padding: 2, flexShrink: 0,
  },
  toggleOn: { backgroundColor: '#2D6A4F' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },

  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  menuRowText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  menuRowChevron: { fontSize: 20, color: '#ccc' },
  menuRowTextDanger: { fontSize: 15, color: '#e53e3e', fontWeight: '600' },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalCancel: { fontSize: 15, color: '#888' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  modalSave: { fontSize: 15, color: '#2D6A4F', fontWeight: '700' },
  modalScroll: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 16 },
  fieldInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa', color: '#1a1a1a',
  },
  fieldInputMulti: { minHeight: 100 },
  charCount: { fontSize: 12, color: '#aaa', textAlign: 'right', marginTop: 4 },
});
