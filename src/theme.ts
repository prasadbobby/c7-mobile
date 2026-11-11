/**
 * PulseFit design tokens — derived from the reference screens and the
 * unified-mobile-experience repo (src/styles.css, oklch → sRGB hex).
 */
export const colors = {
  surface: '#050605', // app background (near-black, faint green)
  background: '#0A0D0B',
  card: '#151816', // cards, tiles, list rows
  secondary: '#1C211D', // rows inside sheets, inactive chips
  muted: '#232924',
  border: 'rgba(255,255,255,0.08)',

  text: '#F4F6F2',
  textMuted: '#959A94',
  textDim: '#6B706A',

  primary: '#C6F21B', // acid lime — CTAs, active state, data highlights
  primaryGlow: '#3DCB55', // green end of the lime gradient
  onPrimary: '#0A0F07',
  cream: '#F9F9F5', // START pill, score chip

  heroTop: '#1F5A1E', // radial glow at the top of every screen
  heroMid: '#0C1A0D',
  deep: '#0E3D14',

  danger: '#E9432D', // workout activity, notification dot
  calories: '#F05A28',
  protein: '#16B3EB',
  carbs: '#E99B2A',
  fat: '#955BE3',
  teal: '#00977C',
} as const;

export const gradients = {
  lime: [colors.primary, colors.primaryGlow] as const,
  limeSoft: ['#D6F84A', '#57D66B'] as const,
  hero: [colors.heroTop, colors.heroMid, colors.surface] as const,
  fade: ['transparent', 'rgba(5,6,5,0.55)', colors.surface] as const,
};

export const font = {
  light: 'Lexend_300Light',
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  black: 'Lexend_800ExtraBold',
} as const;

/** Type scale (px). Numbers are set light, labels regular, titles medium. */
export const type = {
  display: { fontFamily: font.light, fontSize: 56, lineHeight: 62, letterSpacing: -1.5 },
  stat: { fontFamily: font.light, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: font.medium, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: font.medium, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: font.medium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyLg: { fontFamily: font.regular, fontSize: 17, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.regular, fontSize: 11, lineHeight: 14 },
  overline: { fontFamily: font.medium, fontSize: 13, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase' as const },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 40 } as const;
export const radius = { sm: 12, md: 20, lg: 24, xl: 28, xxl: 36, pill: 999 } as const;

export const shadow = {
  glow: { shadowColor: colors.primary, shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  card: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
} as const;
