import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#f0f0f0' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Explore', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🧭</Text> }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{ title: 'Serve', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🤝</Text> }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: 'Events', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text> }}
      />
      <Tabs.Screen
        name="testimonies"
        options={{ title: 'Stories', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      />
      {/* resources screen stays in (tabs) folder for routing but has no tab entry */}
      <Tabs.Screen
        name="resources"
        options={{ href: null }}
      />
    </Tabs>
  );
}
