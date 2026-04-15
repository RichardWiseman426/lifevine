import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface Props {
  title?: string;
  rightElement?: React.ReactNode;
}

export function BackHeader({ title, rightElement }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backChevron}>‹</Text>
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      ) : (
        <View style={styles.flex} />
      )}

      <View style={styles.right}>
        {rightElement ?? <View style={styles.rightPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#F5F0E8',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  backChevron: {
    fontSize: 26,
    color: '#2E7D32',
    lineHeight: 28,
    fontWeight: '400',
  },
  backLabel: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  flex: { flex: 1 },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  right: { flexShrink: 0 },
  rightPlaceholder: { width: 60 },
});
