import { View, StyleSheet } from 'react-native';
import { Tabs, ErrorBoundaryProps } from 'expo-router';
import { SideDrawer } from '../../src/components/SideDrawer';
import { ErrorFallback } from '../../src/components/ErrorBoundary';

// Each tab group gets its own error boundary — a crash in one tab
// doesn't take down the whole app.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} onRetry={retry} />;
}

export default function TabLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Tab bar hidden — navigation lives in the SideDrawer
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index"         options={{ title: 'Home'          }} />
        <Tabs.Screen name="organizations" options={{ title: 'Contributors'  }} />
        <Tabs.Screen name="opportunities" options={{ title: 'Serve'         }} />
        <Tabs.Screen name="events"        options={{ title: 'Events'        }} />
        <Tabs.Screen name="testimonies"   options={{ title: 'Community'     }} />
        <Tabs.Screen name="profile"       options={{ title: 'Profile'       }} />
        <Tabs.Screen name="resources"     options={{ href: null             }} />
      </Tabs>

      {/* Drawer lives here so it overlays all tab screens */}
      <SideDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
