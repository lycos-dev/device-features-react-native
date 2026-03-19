import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context';

export interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No entries yet',
  subtitle = 'Tap + to add your first travel entry.',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: theme.border }]}>⊕</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});