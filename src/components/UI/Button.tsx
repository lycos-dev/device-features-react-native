import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
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
          color={variant === 'primary' ? '#FFFFFF' : '#111111'}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.35 },

  // Variants
  primary: { backgroundColor: '#111111' },
  secondary: { backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' },
  danger: { backgroundColor: '#DC2626' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E4E4E7' },

  // Sizes
  sm: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  md: { paddingHorizontal: 20, paddingVertical: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 15 },

  // Labels
  label: { fontWeight: '500', letterSpacing: 0.1 },
  primaryLabel: { color: '#FFFFFF' },
  secondaryLabel: { color: '#111111' },
  dangerLabel: { color: '#FFFFFF' },
  ghostLabel: { color: '#52525B' },

  smLabel: { fontSize: 13 },
  mdLabel: { fontSize: 14 },
  lgLabel: { fontSize: 15 },
});