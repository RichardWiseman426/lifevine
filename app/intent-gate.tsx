import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
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
          <Text style={styles.title}>What do you need help with?</Text>
          <Text style={styles.subtitle}>We'll take you to the right place.</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={styles.optionBtn}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.75}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
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
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  header: { marginBottom: 36 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    lineHeight: 22,
  },

  options: { gap: 12, marginBottom: 32 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#efefef',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  optionIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  optionSub: { fontSize: 13, color: '#888', lineHeight: 17 },
  optionChevron: { fontSize: 24, color: '#ccc', marginLeft: 4 },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 15, color: '#aaa', fontWeight: '500' },
});
