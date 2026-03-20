import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

import { Theme } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  theme?: Theme;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  theme,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  // Build theme-aware variant styles when a theme is provided,
  // otherwise fall back to the original static styles.
  const variantStyle = theme ? getVariantStyle(variant, theme) : styles[variant];
  const labelStyle  = theme ? getLabelStyle(variant, theme)   : styles[`${variant}Label` as keyof typeof styles];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle,
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme ? theme.textInverse : (variant === 'primary' ? '#FFFFFF' : '#111111')}
        />
      ) : (
        <Text style={[styles.label, labelStyle, styles[`${size}Label` as keyof typeof styles]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

function getVariantStyle(variant: ButtonVariant, theme: Theme): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: theme.primary };
    case 'secondary':
      return { backgroundColor: theme.surfaceSecondary, borderWidth: 1, borderColor: theme.border };
    case 'danger':
      return { backgroundColor: theme.error };
    case 'ghost':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border };
  }
}

function getLabelStyle(variant: ButtonVariant, theme: Theme) {
  switch (variant) {
    case 'primary':
      // textInverse flips correctly: white-on-dark in light mode, dark-on-light in dark mode
      return { color: theme.textInverse };
    case 'secondary':
      return { color: theme.textPrimary };
    case 'danger':
      return { color: '#FFFFFF' };
    case 'ghost':
      return { color: theme.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.35 },

  // Fallback static variants (used when no theme prop is passed)
  primary:   { backgroundColor: '#111111' },
  secondary: { backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' },
  danger:    { backgroundColor: '#DC2626' },
  ghost:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E4E4E7' },

  // Sizes
  sm: { paddingHorizontal: 14, paddingVertical: 8,  borderRadius: 6 },
  md: { paddingHorizontal: 20, paddingVertical: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 15 },

  // Fallback static labels
  label:         { fontWeight: '500', letterSpacing: 0.1 },
  primaryLabel:  { color: '#FFFFFF' },
  secondaryLabel:{ color: '#111111' },
  dangerLabel:   { color: '#FFFFFF' },
  ghostLabel:    { color: '#52525B' },

  smLabel: { fontSize: 13 },
  mdLabel: { fontSize: 14 },
  lgLabel: { fontSize: 15 },
});