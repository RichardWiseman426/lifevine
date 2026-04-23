import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BackHeader } from '../src/components/BackHeader';

const MISSION = 'Community Supporting Community.';

const SECTIONS = [
  {
    heading: 'Why LifeVine Exists',
    body: `Life is full. Full of people, full of need, full of opportunity to make a real difference. And sometimes, in the middle of all of it, what people need most isn't a service — it's a community that shows up.

We built LifeVine because we believe community is the backbone of a healthy society — and because we wanted to build something that looks a little more like Jesus. Something that shows up without conditions, that gives without keeping score, and that makes space for everyone regardless of who they are or where they've been. An outlet for the kind of good that actually changes things.

The name says it. LifeVine is the vine — and we believe that when a community tends to something together with no agenda, no judgment, and no conditions attached, it produces something beautiful. Contributors plant and pour in. People connect, serve, and grow alongside one another. The fruit of that? A community that actually thrives.`,
  },
  {
    heading: "Where We're Coming From",
    body: `LifeVine is a Christian-based platform. That's not a disclaimer — it's the heartbeat of everything we've built.

Our inspiration is simple: Jesus spent his life with the overlooked, the struggling, and the forgotten. He fed the hungry, sat with the outcast, healed without a waiting list, and loved without condition. He never asked who deserved it first. He just helped.

That's the standard we're holding ourselves to. Not perfectly — but sincerely.

Whether you're someone in a hard season or someone who has everything they need — you belong here. It takes every kind of person to make a community work, and every single one of them is welcome.

We believe the Church, at its best, has always been the world's most effective community care network. LifeVine is our attempt to make that easier, more connected, and more accessible than ever before.`,
  },
  {
    heading: 'Our Promise to You',
    body: `You don't have to share our faith to use this app. You don't have to believe anything, sign anything, or become anything.

There is no pressure here. No strings. No hidden ask.

LifeVine is a place to find connection — with contributors, events, volunteer opportunities, and people who genuinely care. It's a place to discover what's happening in your community, to serve, to show up, and to be shown up for. And if you're walking through something hard, our contributors and resource listings do their best to help point you toward what you need.

Whatever brings you here — you're welcome. That's it.`,
  },
  {
    heading: 'Our Hope',
    body: `Here's what we do believe: when people experience real kindness — the uncomplicated kind, the kind with no catch, no strings attached — it changes things. Not always dramatically. Sometimes it's quiet. A burden that lifts a little. A moment of feeling less alone. A door that opens where there wasn't one before.

We believe that through the good work of this community, seeds get planted. Some grow slowly. Some take years. We're okay with that.

If, somewhere along the way, someone looks at the love and care they received here and wants to know more about where it comes from — that's a conversation we'd love to have. But only ever on their terms, in their time, with zero pressure.

We just want to love people well. We'll leave the rest to God.`,
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="About LifeVine" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/brand/images/lv-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmarkLife}>Life</Text>
            <Text style={styles.wordmarkVine}>Vine</Text>
          </View>
          <View style={styles.missionPill}>
            <Text style={styles.missionText}>{MISSION}</Text>
          </View>
        </View>

        {/* App icon */}
        <View style={styles.iconRow}>
          <Image
            source={require('../assets/brand/images/app-icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <View style={styles.iconCaption}>
            <Text style={styles.iconCaptionTitle}>A place to belong.</Text>
            <Text style={styles.iconCaptionSub}>
              LifeVine is a gathering place — a community board built around Christian values where people connect, organizations share what they have to offer, and everyone is welcome at the table. Whether you're here to serve, to find support, or simply to be part of something, there's a place for you here.
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content sections */}
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {/* Verse */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            "Love your neighbor as yourself."
          </Text>
          <Text style={styles.verseRef}>— Mark 12:31</Text>
        </View>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => router.push('/legal/terms')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/legal/donations')}>
            <Text style={styles.legalLink}>Donation Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Footer mark */}
        <View style={styles.footer}>
          <Image
            source={require('../assets/brand/images/monogram.png')}
            style={styles.footerMark}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>
            Made with care — for every single person who finds their way here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingBottom: 56 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  logoMark: {
    width: 100,
    height: 90,
    marginBottom: 16,
  },
  wordmarkRow: { flexDirection: 'row', marginBottom: 16 },
  wordmarkLife: {
    fontSize: 38, fontWeight: '800', letterSpacing: -1.2, lineHeight: 44,
    color: '#1B5E20',
  },
  wordmarkVine: {
    fontSize: 38, fontWeight: '800', letterSpacing: -1.2, lineHeight: 44,
    color: '#4CAF50',
  },
  missionPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  missionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.2,
  },

  // Icon row
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 28,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  appIcon: { width: 64, height: 64, borderRadius: 14, flexShrink: 0 },
  iconCaption: { flex: 1 },
  iconCaptionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  iconCaptionSub: { fontSize: 13, color: '#78716C', lineHeight: 19 },

  divider: {
    height: 1,
    backgroundColor: '#E5DDD4',
    marginHorizontal: 24,
    marginBottom: 32,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 15,
    color: '#57534E',
    lineHeight: 26,
  },

  // Verse
  verseCard: {
    marginHorizontal: 24,
    marginBottom: 40,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#1C1917',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
    fontWeight: '500',
  },
  verseRef: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700',
  },

  // Legal links
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  legalLink: { fontSize: 12, color: '#2D6A4F', fontWeight: '600' },
  legalDot: { fontSize: 12, color: '#A8A29E' },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
    gap: 12,
  },
  footerMark: { width: 52, height: 52 },
  footerText: {
    fontSize: 13,
    color: '#A8A29E',
    fontStyle: 'italic',
  },
});
