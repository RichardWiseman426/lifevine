import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUpcomingEvents } from '../../src/hooks/useEvents';
import { EventCard } from '../../src/components/EventCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function EventsScreen() {
  const { occurrences, loading } = useUpcomingEvents();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Events" subtitle="Upcoming services, gatherings & more" />

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
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  list: { paddingTop: 4, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
