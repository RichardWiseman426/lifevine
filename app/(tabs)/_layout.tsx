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
        <Tabs.Screen name="index"          options={{ title: 'Home'         }} />
        <Tabs.Screen name="resources"      options={{ title: 'Resources'    }} />
        <Tabs.Screen name="get-involved"   options={{ title: 'Get Involved' }} />
        <Tabs.Screen name="stories"        options={{ title: 'Stories'      }} />
        <Tabs.Screen name="profile"        options={{ title: 'Profile'      }} />
        {/* Legacy screens — still routable from detail pages, hidden from tab nav */}
        <Tabs.Screen name="organizations"  options={{ href: null }} />
        <Tabs.Screen name="opportunities"  options={{ href: null }} />
        <Tabs.Screen name="events"         options={{ href: null }} />
        <Tabs.Screen name="testimonies"    options={{ href: null }} />
      </Tabs>

      {/* Drawer lives here so it overlays all tab screens */}
      <SideDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
