import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { BackHeader } from '../src/components/BackHeader';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';

// ── Org types ────────────────────────────────────────────────────
const ORG_TYPES = [
  { key: 'church',        label: 'Church' },
  { key: 'ministry',      label: 'Ministry / Para-church' },
  { key: 'support_group', label: 'Support Group' },
  { key: 'therapy',       label: 'Counseling & Therapy' },
  { key: 'medical',       label: 'Medical / Health' },
  { key: 'community',     label: 'Community Organization' },
];

// ── Christian denominations ──────────────────────────────────────
const DENOMINATIONS = [
  'Non-denominational / Independent',
  'Southern Baptist Convention',
  'Independent / Fundamental Baptist',
  'American Baptist Churches USA',
  'United Methodist Church',
  'Free Methodist Church',
  'Wesleyan Church',
  'Presbyterian Church in America (PCA)',
  'Presbyterian Church USA (PCUSA)',
  'Reformed Presbyterian Church',
  'Christian Reformed Church',
  'Reformed Church in America',
  'Lutheran Church — Missouri Synod (LCMS)',
  'Evangelical Lutheran Church in America (ELCA)',
  'Wisconsin Evangelical Lutheran Synod (WELS)',
  'Anglican / Episcopal',
  'Assemblies of God',
  'Church of God (Cleveland, TN)',
  'Pentecostal Church of God',
  'Foursquare Church',
  'United Pentecostal Church',
  'Church of the Nazarene',
  'Salvation Army',
  'Churches of Christ (a cappella)',
  'Christian Church / Disciples of Christ',
  'Evangelical Free Church of America',
  'Calvary Chapel',
  'Vineyard Church',
  'Acts 29 Network',
  'Bible Church / Community Church',
  'Seventh-day Adventist',
  'Roman Catholic',
  'Eastern Orthodox',
  'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// ── Picker modal ─────────────────────────────────────────────────
function PickerModal({
  visible, title, options, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modal.safe}>
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={modal.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modal.title}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <FlatList
          data={options}
          keyExtractor={(o) => o}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={modal.row}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={modal.rowText}>{item}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={modal.sep} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Field helpers ────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={form.field}>
      <Text style={form.label}>
        {label}{required && <Text style={form.req}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function SelectButton({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={form.select} onPress={onPress} activeOpacity={0.75}>
      <Text style={value ? form.selectValue : form.selectPlaceholder}>
        {value || placeholder}
      </Text>
      <Text style={form.selectChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────
export default function ContributorApplyScreen() {
  const { user } = useAuthStore();

  const [orgName, setOrgName]         = useState('');
  const [orgType, setOrgType]         = useState('');
  const [denomination, setDenomination] = useState('');
  const [city, setCity]               = useState('');
  const [state, setState]             = useState('');
  const [website, setWebsite]         = useState('');
  const [description, setDescription] = useState('');
  const [usageIntent, setUsageIntent] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [agreed, setAgreed]           = useState(false);

  const [showTypePicker, setShowTypePicker]   = useState(false);
  const [showDenomPicker, setShowDenomPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const orgTypeLabel = ORG_TYPES.find(t => t.key === orgType)?.label ?? '';

  async function handleSubmit() {
    if (!orgName.trim())       return Alert.alert('Required', 'Please enter the organization name.');
    if (!orgType)              return Alert.alert('Required', 'Please select an organization type.');
    if (orgType === 'church' && !denomination) return Alert.alert('Required', 'Please select a denomination.');
    if (!description.trim())   return Alert.alert('Required', 'Please describe your organization.');
    if (!contactName.trim())   return Alert.alert('Required', 'Please enter a contact name.');
    if (!contactEmail.trim())  return Alert.alert('Required', 'Please enter a contact email.');
    if (!agreed)               return Alert.alert('Agreement required', 'Please agree to the community guidelines before submitting.');

    setSubmitting(true);
    const { error } = await supabase.from('contributor_applications').insert({
      org_name:      orgName.trim(),
      org_type:      orgType,
      denomination:  orgType === 'church' ? denomination : null,
      city:          city.trim() || null,
      state:         state || null,
      website_url:   website.trim() || null,
      description:   description.trim(),
      usage_intent:  usageIntent.trim() || null,
      contact_name:  contactName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim() || null,
      status:        'pending',
      submitted_by:  user?.id ?? null,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSubmitted(true);
    }
  }

  // ── Success state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BackHeader title="Application Submitted" />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🌱</Text>
          <Text style={styles.successTitle}>You're on your way.</Text>
          <Text style={styles.successBody}>
            Your application has been received and is now under review. We'll be in touch
            at {contactEmail} once it's been processed. Thank you for wanting to be part of LifeVine.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.successBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BackHeader title="Become a Contributor" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Join LifeVine as a Contributor</Text>
          <Text style={styles.introBody}>
            Contributors are the organizations, churches, ministries, and care providers
            that make this community real. Tell us about your organization and we'll
            review your application within 2–3 business days.
          </Text>
        </View>

        {/* Section 1 — Organization */}
        <Text style={styles.sectionHeader}>Organization Info</Text>

        <Field label="Organization Name" required>
          <TextInput
            style={form.input}
            value={orgName}
            onChangeText={setOrgName}
            placeholder="e.g. Hope Community Church"
            maxLength={200}
          />
        </Field>

        <Field label="Organization Type" required>
          <SelectButton
            value={orgTypeLabel}
            placeholder="Select a type…"
            onPress={() => setShowTypePicker(true)}
          />
        </Field>

        {orgType === 'church' && (
          <Field label="Denomination" required>
            <SelectButton
              value={denomination}
              placeholder="Select denomination…"
              onPress={() => setShowDenomPicker(true)}
            />
          </Field>
        )}

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="City">
              <TextInput
                style={form.input}
                value={city}
                onChangeText={setCity}
                placeholder="Dallas"
                maxLength={80}
              />
            </Field>
          </View>
          <View style={{ width: 90 }}>
            <Field label="State">
              <SelectButton
                value={state}
                placeholder="TX"
                onPress={() => setShowStatePicker(true)}
              />
            </Field>
          </View>
        </View>

        <Field label="Website">
          <TextInput
            style={form.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourorg.org"
            autoCapitalize="none"
            keyboardType="url"
            maxLength={300}
          />
        </Field>

        <Field label="About your organization" required>
          <TextInput
            style={[form.input, form.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what your organization does and who you serve…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={form.charCount}>{description.length}/2000</Text>
        </Field>

        <Field label="How do you plan to use LifeVine?">
          <TextInput
            style={[form.input, form.multiline]}
            value={usageIntent}
            onChangeText={setUsageIntent}
            placeholder="e.g. Post events, connect with volunteers, share testimonies…"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={1000}
          />
        </Field>

        {/* Section 2 — Contact */}
        <Text style={styles.sectionHeader}>Primary Contact</Text>

        <Field label="Contact Name" required>
          <TextInput
            style={form.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder="Full name"
            maxLength={120}
            autoCapitalize="words"
          />
        </Field>

        <Field label="Contact Email" required>
          <TextInput
            style={form.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="contact@yourorg.org"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={200}
          />
        </Field>

        <Field label="Contact Phone">
          <TextInput
            style={form.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="(555) 000-0000"
            keyboardType="phone-pad"
            maxLength={30}
          />
        </Field>

        {/* Agreement */}
        <TouchableOpacity
          style={styles.agreeRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.75}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            I agree to LifeVine's community guidelines and confirm this information is accurate.
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!agreed || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!agreed || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Application</Text>
          }
        </TouchableOpacity>

        <Text style={styles.footNote}>
          Applications are reviewed by the LifeVine team within 2–3 business days.
          You'll receive a confirmation email once a decision has been made.
        </Text>
      </ScrollView>

      {/* Pickers */}
      <PickerModal
        visible={showTypePicker}
        title="Organization Type"
        options={ORG_TYPES.map(t => t.label)}
        onSelect={(label) => {
          const found = ORG_TYPES.find(t => t.label === label);
          if (found) { setOrgType(found.key); setDenomination(''); }
        }}
        onClose={() => setShowTypePicker(false)}
      />
      <PickerModal
        visible={showDenomPicker}
        title="Denomination"
        options={DENOMINATIONS}
        onSelect={setDenomination}
        onClose={() => setShowDenomPicker(false)}
      />
      <PickerModal
        visible={showStatePicker}
        title="State"
        options={US_STATES}
        onSelect={setState}
        onClose={() => setShowStatePicker(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 20, paddingBottom: 48 },

  intro: { marginBottom: 28 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#1C1917', marginBottom: 8, letterSpacing: -0.3 },
  introBody: { fontSize: 14, color: '#78716C', lineHeight: 22 },

  sectionHeader: {
    fontSize: 11, fontWeight: '800', color: '#A8A29E',
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: 14, marginTop: 8,
  },

  row2: { flexDirection: 'row', gap: 12 },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 24, marginBottom: 20 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#D4C4B0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  checkboxChecked: { borderColor: '#2E7D32', backgroundColor: '#2E7D32' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  agreeText: { flex: 1, fontSize: 13, color: '#57534E', lineHeight: 20 },

  submitBtn: {
    backgroundColor: '#2E7D32', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#C4B9AF' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  footNote: { fontSize: 12, color: '#A8A29E', textAlign: 'center', marginTop: 16, lineHeight: 18 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 56, marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1C1917', marginBottom: 14, letterSpacing: -0.4 },
  successBody: { fontSize: 15, color: '#78716C', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  successBtn: {
    backgroundColor: '#2E7D32', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const form = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#57534E', marginBottom: 6 },
  req: { color: '#B8864E' },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5DDD4',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1C1917',
  },
  multiline: { minHeight: 100, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#A8A29E', textAlign: 'right', marginTop: 4 },
  select: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5DDD4',
    paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectValue: { fontSize: 15, color: '#1C1917', flex: 1 },
  selectPlaceholder: { fontSize: 15, color: '#A8A29E', flex: 1 },
  selectChevron: { fontSize: 20, color: '#C4B9AF', marginLeft: 8 },
});

const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
  },
  cancel: { fontSize: 15, color: '#888', width: 60 },
  title: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  row: { paddingHorizontal: 20, paddingVertical: 16 },
  rowText: { fontSize: 15, color: '#1C1917' },
  sep: { height: 1, backgroundColor: '#F5F0E8', marginHorizontal: 20 },
});
