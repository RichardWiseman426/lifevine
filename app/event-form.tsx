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
  { value: 'service',   label: 'Service' },
  { value: 'community', label: 'Community' },
  { value: 'support',   label: 'Support' },
  { value: 'workshop',  label: 'Workshop' },
  { value: 'youth',     label: 'Youth' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateTime(date: string, time: string): string | null {
  const d = date.trim();
  const t = time.trim();
  if (!d) return null;
  const combined = t ? `${d} ${t}` : d;
  const parsed = new Date(combined);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboardType, hint,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
  hint?: string;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4B9AF"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function TextAreaField({
  label, value, onChangeText, placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, f.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4B9AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EventFormScreen() {
  const { id, orgId } = useLocalSearchParams<{ id?: string; orgId?: string }>();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Linked IDs when editing
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [occurrenceId, setOccurrenceId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle]               = useState('');
  const [category, setCategory]         = useState<string>('service');
  const [description, setDescription]   = useState('');
  const [isVirtual, setIsVirtual]       = useState(false);
  const [virtualUrl, setVirtualUrl]     = useState('');
  const [city, setCity]                 = useState('');
  const [state, setState]               = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [startDate, setStartDate]       = useState('');
  const [startTime, setStartTime]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [endTime, setEndTime]           = useState('');

  // Load existing event when editing
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const [evtRes, schedRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('event_schedules')
          .select('id, starts_at, ends_at')
          .eq('event_id', id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (evtRes.data) {
        const ev = evtRes.data;
        setTitle(ev.title ?? '');
        setCategory(ev.category ?? 'service');
        setDescription(ev.description ?? '');
        setIsVirtual(ev.is_virtual ?? false);
        setVirtualUrl(ev.virtual_url ?? '');
        setCity(ev.city ?? '');
        setState(ev.state ?? '');
        setMaxAttendees(ev.max_attendees != null ? String(ev.max_attendees) : '');
      }

      if (schedRes.data) {
        setScheduleId(schedRes.data.id);
        if (schedRes.data.starts_at) {
          const d = new Date(schedRes.data.starts_at);
          setStartDate(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          setStartTime(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        }
        if (schedRes.data.ends_at) {
          const d = new Date(schedRes.data.ends_at);
          setEndDate(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          setEndTime(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        }

        // Get matching occurrence
        const occRes = await supabase
          .from('event_occurrences')
          .select('id')
          .eq('schedule_id', schedRes.data.id)
          .maybeSingle();
        if (occRes.data) setOccurrenceId(occRes.data.id);
      }

      setLoading(false);
    })();
  }, [id, isEdit]);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this event.');
      return;
    }

    const startsAtISO = parseDateTime(startDate, startTime);
    const endsAtISO   = parseDateTime(endDate, endTime);

    if (startsAtISO && endsAtISO && new Date(endsAtISO) <= new Date(startsAtISO)) {
      Alert.alert('Invalid dates', 'End date/time must be after the start.');
      return;
    }

    setSaving(true);

    const eventPayload: Record<string, any> = {
      title: title.trim(),
      category,
      description: description.trim() || null,
      is_virtual: isVirtual,
      virtual_url: isVirtual ? (virtualUrl.trim() || null) : null,
      city: isVirtual ? null : (city.trim() || null),
      state: isVirtual ? null : (state.trim() || null),
      max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
      is_public: true,
      status: 'approved',
    };

    let eventId = id;

    if (isEdit) {
      const { error } = await supabase.from('events').update(eventPayload).eq('id', id!);
      if (error) {
        setSaving(false);
        Alert.alert('Save failed', error.message);
        return;
      }
    } else {
      eventPayload.org_id = orgId;
      eventPayload.created_by = user?.id;
      const { data, error } = await supabase
        .from('events').insert(eventPayload).select('id').single();
      if (error || !data) {
        setSaving(false);
        Alert.alert('Save failed', error?.message ?? 'Unknown error');
        return;
      }
      eventId = data.id;
    }

    // Upsert schedule
    const schedulePayload: Record<string, any> = {
      event_id: eventId,
      recurrence: 'none',
      starts_at: startsAtISO,
      ends_at: endsAtISO,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    let sId = scheduleId;

    if (sId) {
      await supabase.from('event_schedules').update(schedulePayload).eq('id', sId);
    } else {
      const { data: schedData, error: schedErr } = await supabase
        .from('event_schedules').insert(schedulePayload).select('id').single();
      if (schedErr || !schedData) {
        setSaving(false);
        Alert.alert('Schedule error', schedErr?.message ?? 'Unknown error');
        return;
      }
      sId = schedData.id;
    }

    // Upsert occurrence
    if (startsAtISO) {
      const occPayload = {
        event_id: eventId,
        schedule_id: sId,
        starts_at: startsAtISO,
        ends_at: endsAtISO,
        status: 'scheduled',
      };

      if (occurrenceId) {
        await supabase.from('event_occurrences').update(occPayload).eq('id', occurrenceId);
      } else {
        await supabase.from('event_occurrences').insert(occPayload);
      }
    }

    setSaving(false);
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <BackHeader title="Event" />
        <View style={s.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <BackHeader title={isEdit ? 'Edit Event' : 'New Event'} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Basic Info ── */}
        <SectionCard title="Basic Info">
          <Field label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Community Worship" />
          <View style={f.wrap}>
            <Text style={f.label}>Category</Text>
            <ChipPicker
              options={CATEGORIES as any}
              selected={category as any}
              onSelect={(v) => setCategory(v)}
            />
          </View>
          <TextAreaField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What can people expect at this event?"
          />
        </SectionCard>

        {/* ── Date & Time ── */}
        <SectionCard title="Date & Time">
          <Text style={s.dateHint}>
            Enter dates in any recognizable format, e.g. "Jun 15, 2026" and times like "6:00 PM" or "18:00".
          </Text>
          <View style={s.dateRow}>
            <View style={s.dateHalf}>
              <Field
                label="Start Date *"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="Jun 15, 2026"
              />
            </View>
            <View style={s.dateHalf}>
              <Field
                label="Start Time"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="6:00 PM"
              />
            </View>
          </View>
          <View style={s.dateRow}>
            <View style={s.dateHalf}>
              <Field
                label="End Date"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="Jun 15, 2026"
              />
            </View>
            <View style={s.dateHalf}>
              <Field
                label="End Time"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="8:00 PM"
              />
            </View>
          </View>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard title="Location">
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Virtual / Online</Text>
            <Switch
              value={isVirtual}
              onValueChange={setIsVirtual}
              trackColor={{ true: '#2D6A4F', false: '#E5DDD4' }}
              thumbColor="#fff"
            />
          </View>
          {isVirtual ? (
            <Field
              label="Meeting URL"
              value={virtualUrl}
              onChangeText={setVirtualUrl}
              placeholder="https://zoom.us/j/..."
              keyboardType="url"
            />
          ) : (
            <>
              <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Nashville" />
              <Field label="State" value={state} onChangeText={setState} placeholder="e.g. TN" />
            </>
          )}
        </SectionCard>

        {/* ── Capacity ── */}
        <SectionCard title="Capacity">
          <Field
            label="Max Attendees (optional)"
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder="Leave blank for unlimited"
            keyboardType="numeric"
          />
        </SectionCard>

        {/* ── Save ── */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Event'}</Text>}
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
    justifyContent: 'space-between', paddingVertical: 8, marginBottom: 4,
  },
  toggleLabel: { fontSize: 15, color: '#1C1917', fontWeight: '600' },
  dateHint: { fontSize: 12, color: '#A8A29E', lineHeight: 18, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateHalf: { flex: 1 },
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
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F0E8',
  },
  chipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipText: { fontSize: 13, color: '#57534E', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
});
