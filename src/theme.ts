// LifeVine Design Tokens
// Warm, calm, human-centered

export const colors = {
  // Backgrounds
  bg:          '#F5F0E8',   // warm linen — main app background
  surface:     '#FFFFFF',   // card / sheet surfaces
  surfaceWarm: '#FAF7F2',   // slightly tinted surface

  // Brand green
  primary:      '#2D6A4F',
  primaryLight: '#52B788',
  primaryMuted: '#E2F0E8',  // chip / badge fill

  // Warm amber accent (featured, highlights)
  accent:      '#B8864E',
  accentLight: '#FDF3E3',

  // Text
  text:          '#1C1917',  // warm near-black
  textSecondary: '#78716C',  // warm medium gray
  textMuted:     '#A8A29E',  // warm light gray

  // Borders
  border:      '#E5DDD4',
  borderLight: '#EDE7DF',

  // Status
  danger:      '#C0392B',
  dangerLight: '#FDEEEE',
  info:        '#2563EB',
  infoLight:   '#EFF6FF',

  // Category colors (muted, warm)
  category: {
    healing:     { bg: '#FDF3E3', text: '#92400E' },
    provision:   { bg: '#E2F0E8', text: '#1A5C37' },
    community:   { bg: '#EEF4FF', text: '#1E3A8A' },
    restoration: { bg: '#FCF0F8', text: '#86198F' },
    salvation:   { bg: '#F3F0FF', text: '#4C1D95' },
  } as Record<string, { bg: string; text: string }>,
};

export const radius = {
  xs:   6,
  sm:   10,
  md:   16,
  lg:   22,
  xl:   28,
  full: 999,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const shadow = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.text },
  h1:      { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3, color: colors.text },
  h2:      { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3:      { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  label:   { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, color: colors.textMuted },
};
