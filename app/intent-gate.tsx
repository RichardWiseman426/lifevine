import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useIntentStore, IntentMode } from '../src/store/intent';

const OPTIONS: {
  mode: IntentMode;
  label: string;
  sub: string;
  icon: string;
  route: string;
}[] = [
  {
    mode: 'help_now',
    label: 'I need help now',
    sub: 'Emergency services and immediate assistance',
    icon: '🆘',
    route: '/emergency',
  },
  {
    mode: 'support',
    label: 'I need support',
    sub: 'Counseling, community, and ongoing care',
    icon: '🤝',
    route: '/(tabs)/resources',
  },
  {
    mode: 'help_others',
    label: 'I want to help others',
    sub: 'Volunteer, serve, and make a difference',
    icon: '💛',
    route: '/(tabs)/opportunities',
  },
  {
    mode: 'browsing',
    label: "I'm just browsing",
    sub: 'Explore everything at your own pace',
    icon: '🧭',
    route: '/(tabs)',
  },
];

export default function IntentGateScreen() {
  const { setMode, setNeedsGate } = useIntentStore();

  function handleSelect(option: typeof OPTIONS[number]) {
    setMode(option.mode);
    // Emergency screen uses push so back arrow returns here;
    // all other routes replace (clear the gate from history).
    if (option.mode === 'help_now') {
      setNeedsGate(false);
      router.push(option.route as any);
    } else {
      setNeedsGate(false);
      router.replace(option.route as any);
    }
  }

  function handleSkip() {
    setMode('browsing');
    setNeedsGate(false);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/brand/images/lv-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={styles.title}>What do you need{'\n'}help with today?</Text>
          <Text style={styles.subtitle}>We'll take you to the right place.</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={styles.optionBtn}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.72}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.optionIcon}>{opt.icon}</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              <Text style={styles.optionChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  header: { marginBottom: 32 },
  logoMark: {
    width: 120,
    height: 108,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1C1917',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#78716C',
    lineHeight: 22,
  },

  options: { gap: 10, marginBottom: 30 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5DDD4',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIcon: { fontSize: 22 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 2, letterSpacing: -0.1 },
  optionSub: { fontSize: 12, color: '#78716C', lineHeight: 17 },
  optionChevron: { fontSize: 22, color: '#C4B9AF', marginLeft: 4 },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 14, color: '#A8A29E', fontWeight: '500' },
});
