import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDrawerStore } from '../store/drawer';

interface Props {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

function HamburgerIcon() {
  return (
    <View style={hamburgerStyles.wrap}>
      <View style={hamburgerStyles.line} />
      <View style={[hamburgerStyles.line, { width: 14 }]} />
      <View style={hamburgerStyles.line} />
    </View>
  );
}

const hamburgerStyles = StyleSheet.create({
  wrap: { gap: 4, alignItems: 'flex-end', padding: 4 },
  line: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#1C1917',
  },
});

export function ScreenHeader({ title, subtitle, rightElement }: Props) {
  const { open } = useDrawerStore();

  return (
    <View style={styles.header}>
      {/* Hamburger — LEFT */}
      <TouchableOpacity
        onPress={open}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.hamburger}
      >
        <HamburgerIcon />
      </TouchableOpacity>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* Optional right element */}
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
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  hamburger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5DDD4',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
    lineHeight: 18,
  },
  right: { flexShrink: 0 },
  rightPlaceholder: { width: 36 },
});
