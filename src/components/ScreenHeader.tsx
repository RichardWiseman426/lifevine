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
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        {rightElement ?? null}
        <TouchableOpacity
          onPress={open}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.hamburger}
        >
          <HamburgerIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
  },
  left: { flex: 1, paddingRight: 12 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: '#78716C',
    marginTop: 3,
    lineHeight: 19,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
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
  },
});
