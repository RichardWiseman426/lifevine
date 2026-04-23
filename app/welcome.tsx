import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSettingsStore } from '../src/store/settings';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { setHasSeenWelcome } = useSettingsStore();

  async function handleGetStarted() {
    await setHasSeenWelcome();
    router.replace('/(tabs)');
  }

  return (
    <LinearGradient
      colors={['#052218', '#0D4A2C', '#1A7A4A']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Brand mark top ── */}
        <View style={styles.brandBlock}>
          <Image
            source={require('../assets/brand/images/app-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* ── Text block ── */}
        <View style={styles.textBlock}>
          <Text style={styles.headline}>
            Community{'\n'}Pouring Into{'\n'}Community.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.body}>
            Discover local churches, ministries, and nonprofits making a real
            difference where you live. Attend community events, serve through
            volunteer opportunities, support charitable causes, and share the
            stories that happen when people show up for each other.
          </Text>
        </View>

        {/* ── Feature pills ── */}
        <View style={styles.pillRow}>
          {['Organizations', 'Events', 'Serve', 'Stories'].map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleGetStarted}
            activeOpacity={0.88}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>
          <Text style={styles.finePrint}>Free to join. Always.</Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28 },

  // Brand
  brandBlock: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.04,
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  logo: {
    width: SCREEN_WIDTH * 0.38,
    height: SCREEN_WIDTH * 0.38,
    borderRadius: 28,
  },

  // Text
  textBlock: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 24,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 'auto' as any,
    paddingBottom: 32,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pillText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // CTA
  ctaBlock: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    color: '#0D4A2C',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  finePrint: {
    marginTop: 14,
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '500',
  },
});
