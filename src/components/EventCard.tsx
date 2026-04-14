import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { EventOccurrence } from '../hooks/useEvents';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface Props {
  occurrence: EventOccurrence;
  onPress: () => void;
}

export function EventCard({ occurrence: o, onPress }: Props) {
  const ev = o.events;
  if (!ev) return null;

  const title = o.override_title ?? ev.title;
  const location = ev.is_virtual ? 'Online' : [ev.city, ev.state].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dateStrip}>
        <Text style={styles.dateText}>{formatDate(o.starts_at)}</Text>
        <Text style={styles.timeText}>{formatTime(o.starts_at)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{ev.category.replace(/_/g, ' ')}</Text>
          </View>
          {ev.is_virtual && (
            <View style={[styles.chip, styles.virtualChip]}>
              <Text style={[styles.chipText, styles.virtualChipText]}>Online</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {ev.organizations?.name && (
          <Text style={styles.org}>{ev.organizations.name}</Text>
        )}
        {ev.short_description && (
          <Text style={styles.description} numberOfLines={2}>{ev.short_description}</Text>
        )}
        <View style={styles.footer}>
          {location && <Text style={styles.meta}>📍 {location}</Text>}
          {o.rsvp_count > 0 && (
            <Text style={styles.meta}>{o.rsvp_count} attending</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5DDD4',
  },
  dateStrip: {
    backgroundColor: '#2D6A4F',
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  dateText: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  timeText: { color: '#A8D5B8', fontSize: 11, textAlign: 'center', marginTop: 5 },
  content: { flex: 1, padding: 16 },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 9 },
  chip: {
    backgroundColor: '#E2F0E8',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#C6DFD0',
  },
  chipText: { fontSize: 11, color: '#2D6A4F', fontWeight: '600', textTransform: 'capitalize' },
  virtualChip: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  virtualChipText: { color: '#4338CA' },
  title: { fontSize: 15, fontWeight: '700', color: '#1C1917', marginBottom: 4, letterSpacing: -0.1 },
  org: { fontSize: 12, color: '#2D6A4F', fontWeight: '600', marginBottom: 7 },
  description: { fontSize: 12, color: '#78716C', lineHeight: 18, marginBottom: 9 },
  footer: { flexDirection: 'row', gap: 12 },
  meta: { fontSize: 11, color: '#78716C' },
});
