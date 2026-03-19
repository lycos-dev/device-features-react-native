export const LightTheme = {
  mode: 'light' as const,

  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F5',

  textPrimary: '#111111',
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textInverse: '#FFFFFF',

  primary: '#111111',
  primaryLight: '#F4F4F5',
  primaryDark: '#000000',

  error: '#DC2626',
  errorLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',

  border: '#E4E4E7',
  borderFocus: '#111111',

  cardBackground: '#FFFFFF',
  cardShadow: '#000000',

  fabBackground: '#111111',
  fabShadow: '#000000',
  fabIcon: '#FFFFFF',
};

export const DarkTheme = {
  mode: 'dark' as const,

  background: '#0A0A0A',
  surface: '#141414',
  surfaceSecondary: '#1F1F1F',

  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  textInverse: '#111111',

  primary: '#FAFAFA',
  primaryLight: '#1F1F1F',
  primaryDark: '#FFFFFF',

  error: '#EF4444',
  errorLight: '#1C0A0A',
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#F59E0B',
  warningLight: '#1C1107',

  border: '#27272A',
  borderFocus: '#FAFAFA',

  cardBackground: '#141414',
  cardShadow: '#000000',

  fabBackground: '#FAFAFA',
  fabShadow: '#000000',
  fabIcon: '#111111',
};

export type Theme = typeof LightTheme;