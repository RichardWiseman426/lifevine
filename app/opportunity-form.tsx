import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth';
import { BackHeader } from '../src/components/BackHeader';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'volunteer',      label: 'Volunteer' },
  { value: 'service',        label: 'Service' },
  { value: 'community_need', label: 'Community Need' },
  { value: 'prayer',         label: 'Prayer' },
  { value: 'mentorship',     label: 'Mentorship' },
];

const STATUSES = [
  { value: 'open',   label: 'Open' },
  { value: 'draft',  label: 'Draft' },
  { value: 'closed', label: 'Closed' },
];

const ACTION_TYPES = [
  { value: 'link',    label: 'Link',      urlLabel: 'URL',           defaultBtn: 'Learn More' },
  { value: 'phone',   label: 'Phone',     urlLabel: 'Phone Number',  defaultBtn: 'Call Now' },
  { value: 'email',   label: 'Email',     urlLabel: 'Email Address', defaultBtn: 'Send Email' },
  { value: 'form',    label: 'Form',      urlLabel: 'Form URL',      defaultBtn: 'Fill Out Form' },
  { value: 'show_up', label: 'Show Up',   urlLabel: '',              defaultBtn: '' },
  { value: 'read',    label: 'Document',  urlLabel: 'Document URL',  defaultBtn: 'View Document' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = {
  id?: string;
  title: string;
  description: string;
  action_type: string;
  action_url: string;
  action_label: string;
};

function blankStep(): Step {
  return { title: '', description: '', action_type: 'link', action_url: '', action_label: '' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(str: string): string | null {
  if (!str.trim()) return null;
  const d = new Date(str.trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, hint,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  hint?: string;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
      <TextInput
        style={[f.input, multiline && f.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4B9AF"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={card.wrap}>
      <Text style={card.title}>{title}</Text>
      {children}
    </View>
  );
}

function ChipPicker<T extends string>({
  options, selected, onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={cp.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[cp.chip, selected === o.value && cp.chipActive]}
          onPress={() => onSelect(o.value)}
          activeOpacity={0.75}
        >
          <Text style={[cp.chipText, selected === o.value && cp.chipTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Step Builder ─────────────────────────────────────────────────────────────

function StepEditor({
  step, index, total, onChange, onRemove,
}: {
  step: Step; index: number; total: number;
  onChange: (s: Step) => void;
  onRemove: () => void;
}) {
  const actionDef = ACTION_TYPES.find((a) => a.value === step.action_type)!;
  const needsUrl = step.action_type !== 'show_up';

  return (
    <View style={se.wrap}>
      <View style={se.header}>
        <View style={se.numBadge}><Text style={se.numText}>{index + 1}</Text></View>
        <Text style={se.headerTitle}>Step {index + 1}</Text>
        {total > 1 && (
          <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={se.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Field
        label="Step Title"
        value={step.title}
        onChangeText={(v) => onChange({ ...step, title: v })}
        placeholder="e.g. Drop off hygiene items"
      />

      <Field
        label="Description (optional)"
        value={step.description}
        onChangeText={(v) => onChange({ ...step, description: v })}
        placeholder="Any extra context for this step"
        multiline
      />

      <View style={f.wrap}>
        <Text style={f.label}>Action Type</Text>
        <Text style={f.hint}>What does the button do?</Text>
        <ChipPicker
          options={ACTION_TYPES.map((a) => ({ value: a.value as any, label: a.label }))}
          selected={step.action_type as any}
          onSelect={(v) => onChange({ ...step, action_type: v })}
        />
      </View>

      {needsUrl && (
        <Field
          label={actionDef.urlLabel}
          value={step.action_url}
          onChangeText={(v) => onChange({ ...step, action_url: v })}
          placeholder={
            step.action_type === 'phone' ? 'e.g. 555-867-5309' :
            step.action_type === 'email' ? 'e.g. help@org.org' :
            'https://'
          }
          keyboardType={step.action_type === 'phone' ? 'phone-pad' : step.action_type === 'email' ? 'email-address' : 'default'}
        />
      )}

      {needsUrl && (
        <Field
          label="Button Label (optional)"
          value={step.action_label}
          onChangeText={(v) => onChange({ ...step, action_label: v })}
          placeholder={actionDef.defaultBtn || 'e.g. View the List'}
        />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OpportunityFormScreen() {
  const { id, orgId } = useLocalSearchParams<{ id?: string; orgId?: string }>();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Basic fields
  const [title, setTitle]                   = useState('');
  const [category, setCategory]             = useState<string>('volunteer');
  const [status, setStatus]                 = useState<string>('open');
  const [shortDesc, setShortDesc]           = useState('');
  const [description, setDescription]       = useState('');
  const [isRemote, setIsRemote]             = useState(false);
  const [city, setCity]                     = useState('');
  const [state, setState]                   = useState('');
  const [spotsTotal, setSpotsTotal]         = useState('');
  const [startsAt, setStartsAt]             = useState('');
  const [endsAt, setEndsAt]                 = useState('');
  const [commitment, setCommitment]         = useState('');
  const [contactName, setContactName]       = useState('');
  const [contactEmail, setContactEmail]     = useState('');
  const [contactPhone, setContactPhone]     = useState('');

  // Steps
  const [steps, setSteps] = useState<Step[]>([blankStep()]);

  // Load existing data if editing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const [oppRes, stepsRes] = await Promise.all([
        supabase.from('opportunities').select('*').eq('id', id).single(),
        supabase.from('opportunity_steps')
          .select('*').eq('opportunity_id', id)
          .order('step_order', { ascending: true }),
      ]);

      if (oppRes.data) {
        const o = oppRes.data;
        setTitle(o.title ?? '');
        setCategory(o.category ?? 'volunteer');
        setStatus(o.status ?? 'open');
        setShortDesc(o.short_description ?? '');
        setDescription(o.description ?? '');
        setIsRemote(o.is_remote ?? false);
        setCity(o.city ?? '');
        setState(o.state ?? '');
        setSpotsTotal(o.spots_total != null ? String(o.spots_total) : '');
        setStartsAt(o.starts_at ? new Date(o.starts_at).toLocaleDateString() : '');
        setEndsAt(o.ends_at ? new Date(o.ends_at).toLocaleDateString() : '');
        setCommitment(o.commitment_description ?? '');
        setContactName(o.contact_name ?? '');
        setContactEmail(o.contact_email ?? '');
        setContactPhone(o.contact_phone ?? '');
      }

      if (stepsRes.data && stepsRes.data.length > 0) {
        setSteps(stepsRes.data.map((s: any) => ({
          id: s.id,
          title: s.title ?? '',
          description: s.description ?? '',
          action_type: s.action_type ?? 'link',
          action_url: s.action_url ?? '',
          action_label: s.action_label ?? '',
        })));
      }

      setLoading(false);
    })();
  }, [id, isEdit]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this opportunity.');
      return;
    }

    setSaving(true);

    const payload: Record<string, any> = {
      title: title.trim(),
      category,
      status,
      short_description: shortDesc.trim() || null,
      description: description.trim() || null,
      is_remote: isRemote,
      city: isRemote ? null : (city.trim() || null),
      state: isRemote ? null : (state.trim() || null),
      spots_total: spotsTotal ? parseInt(spotsTotal, 10) : null,
      starts_at: parseDate(startsAt),
      ends_at: parseDate(endsAt),
      commitment_description: commitment.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
    };

    let oppId = id;

    if (isEdit) {
      const { error } = await supabase
        .from('opportunities').update(payload).eq('id', id!);
      if (error) {
        setSaving(false);
        Alert.alert('Save failed', error.message);
        return;
      }
    } else {
      payload.org_id = orgId;
      payload.created_by = user?.id;
      const { data, error } = await supabase
        .from('opportunities').insert(payload).select('id').single();
      if (error || !data) {
        setSaving(false);
        Alert.alert('Save failed', error?.message ?? 'Unknown error');
        return;
      }
      oppId = data.id;
    }

    // Delete existing steps and reinsert
    await supabase.from('opportunity_steps').delete().eq('opportunity_id', oppId!);

    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length > 0) {
      const stepRows = validSteps.map((s, i) => ({
        opportunity_id: oppId,
        step_order: i + 1,
        title: s.title.trim(),
        description: s.description.trim() || null,
        action_type: s.action_type,
        action_url: s.action_url.trim() || null,
        action_label: s.action_label.trim() || null,
      }));
      const { error: stepsError } = await supabase
        .from('opportunity_steps').insert(stepRows);
      if (stepsError) {
        setSaving(false);
        Alert.alert('Steps not saved', stepsError.message);
        return;
      }
    }

    setSaving(false);
    router.back();
  }

  function updateStep(index: number, updated: Step) {
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title="Opportunity" />
        <View style={s.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title={isEdit ? 'Edit Opportunity' : 'New Opportunity'} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Basic Info ── */}
        <SectionCard title="Basic Info">
          <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Donate hygiene kits for shelter guests" />
          <View style={f.wrap}>
            <Text style={f.label}>Category</Text>
            <ChipPicker
              options={CATEGORIES as any}
              selected={category as any}
              onSelect={(v) => setCategory(v)}
            />
          </View>
          <View style={f.wrap}>
            <Text style={f.label}>Status</Text>
            <ChipPicker
              options={STATUSES as any}
              selected={status as any}
              onSelect={(v) => setStatus(v)}
            />
          </View>
          <Field label="Short Description" value={shortDesc} onChangeText={setShortDesc} placeholder="One sentence summary" />
          <Field label="Full Description" value={description} onChangeText={setDescription} placeholder="Describe the opportunity in detail" multiline />
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard title="Location">
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Remote / Online</Text>
            <Switch
              value={isRemote}
              onValueChange={setIsRemote}
              trackColor={{ true: '#2D6A4F', false: '#E5DDD4' }}
              thumbColor="#fff"
            />
          </View>
          {!isRemote && (
            <>
              <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Nashville" />
              <Field label="State" value={state} onChangeText={setState} placeholder="e.g. TN" />
            </>
          )}
        </SectionCard>

        {/* ── Details ── */}
        <SectionCard title="Details">
          <Field
            label="Total Spots Available"
            value={spotsTotal}
            onChangeText={setSpotsTotal}
            placeholder="Leave blank for unlimited"
            keyboardType="numeric"
          />
          <Field
            label="Start Date (optional)"
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="e.g. Jun 15, 2026"
            hint="Any recognizable date format works"
          />
          <Field
            label="End Date (optional)"
            value={endsAt}
            onChangeText={setEndsAt}
            placeholder="e.g. Jun 30, 2026"
          />
          <Field
            label="Time Commitment"
            value={commitment}
            onChangeText={setCommitment}
            placeholder="e.g. One afternoon, 2–3 hours"
          />
        </SectionCard>

        {/* ── Contact ── */}
        <SectionCard title="Contact">
          <Text style={s.sectionHint}>
            This is who respondents reach out to. Shown on the opportunity detail page.
          </Text>
          <Field label="Contact Name" value={contactName} onChangeText={setContactName} placeholder="e.g. Sarah Miller" />
          <Field label="Contact Email" value={contactEmail} onChangeText={setContactEmail} placeholder="sarah@church.org" keyboardType="email-address" />
          <Field label="Contact Phone" value={contactPhone} onChangeText={setContactPhone} placeholder="e.g. 615-555-0100" keyboardType="phone-pad" />
        </SectionCard>

        {/* ── How to Help (Steps) ── */}
        <View style={card.wrap}>
          <Text style={card.title}>How to Help</Text>
          <Text style={s.sectionHint}>
            Add step-by-step actions. Each step can have a button that calls, emails, opens a link, or displays a document. Steps appear in order on the opportunity page.
          </Text>

          {steps.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              index={i}
              total={steps.length}
              onChange={(updated) => updateStep(i, updated)}
              onRemove={() => removeStep(i)}
            />
          ))}

          <TouchableOpacity
            style={s.addStepBtn}
            onPress={() => setSteps((prev) => [...prev, blankStep()])}
          >
            <Text style={s.addStepText}>+ Add Another Step</Text>
          </TouchableOpacity>
        </View>

        {/* ── Save ── */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Opportunity'}</Text>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
  },
  toggleLabel: { fontSize: 15, color: '#1C1917', fontWeight: '600' },
  sectionHint: { fontSize: 12, color: '#A8A29E', lineHeight: 18, marginBottom: 10 },
  addStepBtn: {
    borderWidth: 1.5, borderColor: '#2D6A4F', borderRadius: 10,
    borderStyle: 'dashed', padding: 14, alignItems: 'center', marginTop: 8,
  },
  addStepText: { color: '#2D6A4F', fontWeight: '700', fontSize: 14 },
  saveBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#E5DDD4',
  },
  title: {
    fontSize: 13, fontWeight: '800', color: '#A8A29E',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
  },
});

const f = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#57534E', marginBottom: 4 },
  hint: { fontSize: 11, color: '#C4B9AF', marginBottom: 6 },
  input: {
    backgroundColor: '#F5F0E8', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5DDD4',
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#1C1917',
  },
  inputMulti: { minHeight: 90, paddingTop: 10 },
});

const cp = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: '#E5DDD4', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#F5F0E8',
  },
  chipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipText: { fontSize: 13, color: '#57534E', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
});

const se = StyleSheet.create({
  wrap: {
    backgroundColor: '#F9F6F1', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#EDE8E2',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  numBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#2D6A4F',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1C1917' },
  removeText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
});
