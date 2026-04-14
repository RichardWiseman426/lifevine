import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUpcomingEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import { EmptyState } from '../../src/components/EmptyState';

export default function EventsScreen() {
  const { occurrences, loading } = useUpcomingEvents();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Events</Text>
        <Text style={styles.sub}>Upcoming services, gatherings &amp; more</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" size="large" />
        </View>
      ) : (
        <FlatList
          data={occurrences}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <EventCard
              occurrence={item}
              onPress={() => router.push(`/event/${item.events?.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No upcoming events"
              subtitle="Events from organizations will appear here"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  sub: { fontSize: 14, color: '#888', marginTop: 2 },
  list: { paddingTop: 4, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
