import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, ScrollView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useIntentStore } from '../src/store/intent';

function call(number: string) {
  Linking.openURL(`tel:${number}`);
}

function openMaps(query: string) {
  const encoded = encodeURIComponent(query);
  const url = Platform.OS === 'ios'
    ? `maps://?q=${encoded}`
    : `geo:0,0?q=${encoded}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/${encoded}`)
  );
}

function sms(number: string, body: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  Linking.openURL(`sms:${number}${sep}body=${encodeURIComponent(body)}`);
}

export default function EmergencyScreen() {
  const { setMode, setNeedsGate } = useIntentStore();

  function handleBack() {
    setMode('browsing');
    setNeedsGate(false);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top bar ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>← Back to app</Text>
        </TouchableOpacity>
      </View>

      {/* ── Primary actions (always visible, no scroll) ── */}
      <View style={styles.primary}>
        <Text style={styles.primaryLabel}>IMMEDIATE HELP</Text>

        <TouchableOpacity
          style={styles.callBtn911}
          onPress={() => call('911')}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnIcon}>📞</Text>
          <View style={styles.callBtnText}>
            <Text style={styles.callBtnNumber}>Call 911</Text>
            <Text style={styles.callBtnSub}>Emergency Services</Text>
          </View>
          <Text style={styles.callBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callBtn988}
          onPress={() => call('988')}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnIcon}>📞</Text>
          <View style={styles.callBtnText}>
            <Text style={styles.callBtnNumber}>Call or Text 988</Text>
            <Text style={styles.callBtnSub}>Suicide & Crisis Lifeline · 24/7</Text>
          </View>
          <Text style={styles.callBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textBtn}
          onPress={() => sms('741741', 'HOME')}
          activeOpacity={0.8}
        >
          <Text style={styles.textBtnText}>💬  Text HOME to 741741 — Crisis Text Line</Text>
        </TouchableOpacity>
      </View>

      {/* ── Divider ─────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Secondary + Tertiary (scrollable) ───────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nearby help */}
        <Text style={styles.sectionLabel}>NEARBY HELP</Text>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => openMaps('emergency room near me')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>🏥</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Find Emergency Room</Text>
            <Text style={styles.resourceSub}>Nearest ER via Maps</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => openMaps('urgent care near me')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>⚕️</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Find Urgent Care</Text>
            <Text style={styles.resourceSub}>Walk-in clinics near you</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => openMaps('mental health crisis center near me')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>🧠</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Find Crisis Center</Text>
            <Text style={styles.resourceSub}>Mental health crisis facilities near you</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        {/* Additional support */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MORE SUPPORT</Text>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => call('18006624357')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>📞</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>SAMHSA Helpline</Text>
            <Text style={styles.resourceSub}>1-800-662-4357 · Substance use & mental health</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => call('9881')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>🎖️</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Veterans Crisis Line</Text>
            <Text style={styles.resourceSub}>Dial 988, then press 1</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceRow}
          onPress={() => call('18004784373')}
        >
          <View style={styles.resourceIcon}>
            <Text style={styles.resourceIconText}>🤍</Text>
          </View>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Domestic Violence Hotline</Text>
            <Text style={styles.resourceSub}>1-800-799-7233 · 24/7 · Safe & confidential</Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            If you or someone else is in immediate danger, call 911.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },

  // ── Primary ──────────────────────────────────────
  primary: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  primaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#aaa',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  callBtn911: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0392B',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  callBtn988: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4F8C',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  callBtnIcon: { fontSize: 24 },
  callBtnText: { flex: 1 },
  callBtnNumber: { fontSize: 18, fontWeight: '800', color: '#fff' },
  callBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  callBtnArrow: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },

  textBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  textBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginBottom: 4,
  },

  // ── Scroll section ───────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#aaa',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 14,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceIconText: { fontSize: 18 },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  resourceSub: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 16 },
  resourceChevron: { fontSize: 20, color: '#ccc' },

  bottomNote: {
    marginTop: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  bottomNoteText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
