import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'error';

export type TextColor = 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'white';

export interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  bold?: boolean;
  italic?: boolean;
  align?: TextStyle['textAlign'];
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  color = 'primary',
  bold = false,
  italic = false,
  align,
  style,
  children,
  ...rest
}) => {
  return (
    <RNText
      style={[
        styles[variant],
        styles[`color_${color}`],
        bold && styles.bold,
        italic && styles.italic,
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Variants
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  error: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },

  // Colors
  color_primary: { color: '#1A1A1A' },
  color_secondary: { color: '#4B5563' },
  color_muted: { color: '#9CA3AF' },
  color_error: { color: '#EF4444' },
  color_success: { color: '#10B981' },
  color_white: { color: '#FFFFFF' },

  // Modifiers
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
});