import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from './BackHeader';

export type LegalSection = {
  heading: string;
  body: string;
};

type Props = {
  title: string;
  effectiveDate: string;
  intro?: string;
  sections: LegalSection[];
  contactEmail?: string;
};

export function LegalScreen({ title, effectiveDate, intro, sections, contactEmail }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title={title} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.effective}>Effective {effectiveDate}</Text>

        {intro ? <Text style={styles.intro}>{intro}</Text> : null}

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        {contactEmail ? (
          <View style={styles.contactCard}>
            <Text style={styles.contactHeading}>Questions?</Text>
            <Text style={styles.contactBody}>
              Reach out at <Text style={styles.contactEmail}>{contactEmail}</Text>
            </Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1917', letterSpacing: -0.5, marginBottom: 4 },
  effective: { fontSize: 12, color: '#A8A29E', marginBottom: 20 },
  intro: { fontSize: 14, color: '#57534E', lineHeight: 22, marginBottom: 20, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  heading: { fontSize: 16, fontWeight: '800', color: '#1C1917', marginBottom: 8, letterSpacing: -0.2 },
  body: { fontSize: 14, color: '#57534E', lineHeight: 22 },
  contactCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: '#E5DDD4', marginTop: 8,
  },
  contactHeading: { fontSize: 14, fontWeight: '800', color: '#1C1917', marginBottom: 6 },
  contactBody: { fontSize: 14, color: '#57534E', lineHeight: 22 },
  contactEmail: { color: '#2D6A4F', fontWeight: '700' },
});
