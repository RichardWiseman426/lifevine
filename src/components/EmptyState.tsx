import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <View style={styles.iconDot} />
        <View style={[styles.iconDot, styles.iconDotMid]} />
        <View style={[styles.iconDot, styles.iconDotSm]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 72,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    flexDirection: 'row',
    gap: 5,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D6A4F',
    opacity: 0.9,
  },
  iconDotMid: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 1,
  },
  iconDotSm: {
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 21,
  },
});
