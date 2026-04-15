import {
  View, Text, Image, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStore } from '../store/drawer';
import { useAuthStore } from '../store/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

const NAV_ITEMS = [
  { label: 'Explore',    icon: '🧭', route: '/(tabs)'               },
  { label: 'Serve',      icon: '🤝', route: '/(tabs)/opportunities'  },
  { label: 'Events',     icon: '📅', route: '/(tabs)/events'         },
  { label: 'Stories',    icon: '💬', route: '/(tabs)/testimonies'    },
  { label: 'Profile',    icon: '👤', route: '/(tabs)/profile'        },
];

export function SideDrawer() {
  const { isOpen, close } = useDrawerStore();
  const { profile, signOut } = useAuthStore();
  const pathname = usePathname();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 0.8,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  function navigate(route: string) {
    close();
    setTimeout(() => router.navigate(route as any), 40);
  }

  function handleSignOut() {
    close();
    setTimeout(() => signOut(), 200);
  }

  const initials = (profile?.display_name ?? profile?.username ?? '?')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.drawerInner} edges={['top', 'bottom']}>

          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerLogoRow}>
              <Image
                source={require('../../assets/brand/images/app-icon.png')}
                style={styles.drawerLogoImage}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.drawerAppName}>LifeVine</Text>
                <Text style={styles.drawerTagline}>Connect. Serve. Belong.</Text>
              </View>
            </View>
          </View>

          {/* User info */}
          {profile && (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => navigate('/(tabs)/profile')}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile.display_name ?? 'Your Profile'}</Text>
                {profile.username ? (
                  <Text style={styles.userHandle}>@{profile.username}</Text>
                ) : null}
              </View>
              <Text style={styles.userChevron}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Nav items */}
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.route
                || (item.route === '/(tabs)' && pathname === '/');
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => navigate(item.route)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Secondary links */}
          <View style={styles.secondaryList}>
            <TouchableOpacity
              style={styles.secondaryItem}
              onPress={() => navigate('/conversations')}
            >
              <Text style={styles.secondaryIcon}>💬</Text>
              <Text style={styles.secondaryLabel}>Messages</Text>
            </TouchableOpacity>

            {profile?.platform_role === 'super_admin' && (
              <TouchableOpacity
                style={styles.secondaryItem}
                onPress={() => navigate('/admin')}
              >
                <Text style={styles.secondaryIcon}>🛡️</Text>
                <Text style={styles.secondaryLabel}>Moderation</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer / sign out */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    zIndex: 101,
    shadowColor: '#1C1917',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 0,
  },

  // Header
  drawerHeader: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 20,
  },
  drawerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerLogoImage: {
    width: 44,
    height: 44,
  },
  drawerAppName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  drawerTagline: {
    fontSize: 11,
    color: '#A8A29E',
    marginTop: 1,
    letterSpacing: 0.2,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    padding: 12,
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  userHandle: { fontSize: 12, color: '#78716C', marginTop: 1 },
  userChevron: { fontSize: 18, color: '#C8C4BE' },

  divider: { height: 1, backgroundColor: '#F0EBE4', marginVertical: 8, marginHorizontal: 22 },

  // Nav
  navList: { paddingHorizontal: 12, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 12,
    position: 'relative',
  },
  navItemActive: { backgroundColor: '#E8F5E9' },
  navIcon: { fontSize: 19, width: 24, textAlign: 'center' },
  navLabel: { fontSize: 15, fontWeight: '600', color: '#78716C', flex: 1 },
  navLabelActive: { color: '#2E7D32', fontWeight: '700' },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#2E7D32',
  },

  // Secondary
  secondaryList: { paddingHorizontal: 12, gap: 2 },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 12,
  },
  secondaryIcon: { fontSize: 17, width: 24, textAlign: 'center' },
  secondaryLabel: { fontSize: 14, color: '#78716C', fontWeight: '500' },

  // Footer
  drawerFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  signOutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
  },
  signOutText: { fontSize: 14, color: '#C0392B', fontWeight: '600' },
});
