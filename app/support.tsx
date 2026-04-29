import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BackHeader } from '../src/components/BackHeader';

// Replace with your real Stripe Payment Link when ready: stripe.com/payment-links
// Leave as empty string to show the "coming soon" state instead of a broken link.
const LIFEVINE_DONATION_URL = '';

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Support Us" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/brand/images/lv-mark.png')}
            style={styles.mark}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Help Us Tend the Vine</Text>
          <Text style={styles.heroSub}>
            LifeVine is built on the belief that community is the backbone of a healthy society.
          </Text>
        </View>

        {/* Statement */}
        <View style={styles.statement}>
          <Text style={styles.body}>
            We believe deeply that this work matters. LifeVine was started with a simple, stubborn conviction — that real connection, honest support, and active service can change a community from the inside out.
          </Text>

          <Text style={styles.body}>
            We don't run ads. We don't sell your data. We never will. LifeVine is free for every person who uses it to find help, connect, and serve. Contributing organizations always have a free listing — and those who want greater reach in their community can choose to do more. Either way, the mission is the same: show up.
          </Text>

          <Text style={styles.body}>
            That model only works if the mission is sustained. Server costs, app store fees, time, and care all add up. If LifeVine has been a blessing to you — or you simply believe in what we're trying to build — your support keeps the lights on and lets us reach further.
          </Text>
        </View>

        {/* The 10% pledge */}
        <View style={styles.pledgeCard}>
          <Text style={styles.pledgeBadge}>OUR PROMISE TO THE COMMUNITY</Text>
          <Text style={styles.pledgeHeading}>10% of every gift goes back out.</Text>
          <Text style={styles.pledgeBody}>
            For every dollar given to LifeVine, we commit to returning at least 10% directly to the community through charitable giving — partnering with crisis funds, local relief efforts, scholarship needs, and contributors doing front-line work.
          </Text>
          <Text style={styles.pledgeBody}>
            As LifeVine grows, our hope is to grow that percentage right alongside it. The vine is meant to bear fruit — and the fruit is meant to be shared.
          </Text>
        </View>

        {/* Verse */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </Text>
          <Text style={styles.verseRef}>— 2 Corinthians 9:7</Text>
        </View>

        {/* Donate button */}
        <View style={styles.donateBlock}>
          {LIFEVINE_DONATION_URL ? (
            <TouchableOpacity
              style={styles.donateBtn}
              onPress={() => Linking.openURL(LIFEVINE_DONATION_URL)}
              activeOpacity={0.85}
            >
              <Text style={styles.donateBtnText}>💛  Make a Gift to LifeVine</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.donateSoon}>
              <Text style={styles.donateSoonTitle}>Giving Portal Coming Soon</Text>
              <Text style={styles.donateSoonBody}>
                Secure online giving will be available here shortly.{'\n'}
                To give now, reach out at{' '}
                <Text
                  style={styles.donateSoonLink}
                  onPress={() => Linking.openURL('mailto:hello@lifevine.app?subject=Gift to LifeVine')}
                >
                  hello@lifevine.app
                </Text>
              </Text>
            </View>
          )}
          <Text style={styles.disclaimer}>
            Gifts to LifeVine are platform support contributions and are not tax-deductible charitable donations. Card details are processed securely by Stripe and are never stored by LifeVine.
          </Text>
          <TouchableOpacity onPress={() => router.push('/legal/donations')}>
            <Text style={styles.policyLink}>Read our Donation Policy →</Text>
          </TouchableOpacity>
        </View>

        {/* Closing */}
        <View style={styles.closing}>
          <Text style={styles.closingText}>
            Thank you for being part of this. Whether you give, share, serve, or simply show up — you are the vine.
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
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  mark: { width: 72, height: 64, marginBottom: 16 },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: '#1C1917',
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, color: '#78716C',
    lineHeight: 22, textAlign: 'center',
  },

  // Statement
  statement: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 14,
  },
  body: { fontSize: 15, color: '#57534E', lineHeight: 25 },

  // Pledge card (the 10%)
  pledgeCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderLeftWidth: 4,
    borderLeftColor: '#B8864E',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pledgeBadge: {
    fontSize: 10, fontWeight: '800',
    color: '#B8864E', letterSpacing: 1.4,
    marginBottom: 10,
  },
  pledgeHeading: {
    fontSize: 20, fontWeight: '800',
    color: '#1C1917', letterSpacing: -0.4,
    marginBottom: 12,
  },
  pledgeBody: {
    fontSize: 14, color: '#57534E',
    lineHeight: 23, marginBottom: 10,
  },

  // Verse
  verseCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 15, fontStyle: 'italic',
    color: '#1C1917', textAlign: 'center',
    lineHeight: 24, marginBottom: 8, fontWeight: '500',
  },
  verseRef: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // Donate
  donateBlock: { paddingHorizontal: 24, marginBottom: 32 },
  donateSoon: {
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  donateSoonTitle: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 6 },
  donateSoonBody: { fontSize: 14, color: '#78716C', textAlign: 'center', lineHeight: 22 },
  donateSoonLink: { color: '#2D6A4F', fontWeight: '700' },
  donateBtn: {
    backgroundColor: '#B8864E',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#B8864E',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 14,
  },
  donateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  disclaimer: {
    fontSize: 11, color: '#A8A29E',
    lineHeight: 17, textAlign: 'center', marginBottom: 12,
  },
  policyLink: {
    fontSize: 12, color: '#2D6A4F',
    fontWeight: '600', textAlign: 'center',
  },

  // Closing
  closing: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  closingText: {
    fontSize: 13, fontStyle: 'italic',
    color: '#A8A29E', textAlign: 'center',
    lineHeight: 21,
  },
});
