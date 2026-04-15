import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { SideDrawer } from '../../src/components/SideDrawer';

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
        <Tabs.Screen name="index"        options={{ title: 'Explore'   }} />
        <Tabs.Screen name="opportunities" options={{ title: 'Serve'     }} />
        <Tabs.Screen name="events"       options={{ title: 'Events'    }} />
        <Tabs.Screen name="testimonies"  options={{ title: 'Stories'   }} />
        <Tabs.Screen name="profile"      options={{ title: 'Profile'   }} />
        <Tabs.Screen name="resources"    options={{ href: null         }} />
      </Tabs>

      {/* Drawer lives here so it overlays all tab screens */}
      <SideDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
