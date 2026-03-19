export const LightTheme = {
  mode: 'light' as const,

  // Backgrounds
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F0FF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Brand
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',

  // Status
  error: '#EF4444',
  errorLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#4F46E5',

  // Card
  cardBackground: '#FFFFFF',
  cardShadow: '#000000',

  // FAB
  fabBackground: '#4F46E5',
  fabShadow: '#4F46E5',
  fabIcon: '#FFFFFF',
};

export const DarkTheme = {
  mode: 'dark' as const,

  // Backgrounds
  background: '#0F0E1A',
  surface: '#1C1B2E',
  surfaceSecondary: '#2A2840',

  // Text
  textPrimary: '#F0EEFF',
  textSecondary: '#A9A5C8',
  textMuted: '#6B6889',
  textInverse: '#1A1A1A',

  // Brand
  primary: '#7C74F0',
  primaryLight: '#2A2840',
  primaryDark: '#A89FF5',

  // Status
  error: '#F87171',
  errorLight: '#2D1515',
  success: '#34D399',
  successLight: '#052E1C',
  warning: '#FBBF24',
  warningLight: '#2D1F05',

  // Borders
  border: '#2E2C47',
  borderFocus: '#7C74F0',

  // Card
  cardBackground: '#1C1B2E',
  cardShadow: '#000000',

  // FAB
  fabBackground: '#7C74F0',
  fabShadow: '#7C74F0',
  fabIcon: '#FFFFFF',
};

export type Theme = typeof LightTheme;
