import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context';

// ─── Theme Toggle (moved from HomeScreen) ────────────────────────────────────
const ThemeToggle: React.FC<{
  isDark: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ isDark, onToggle, theme }) => {
  const translateX = useRef(new Animated.Value(isDark ? 30 : 2)).current;

  const handlePress = () => {
    Animated.spring(translateX, {
      toValue: isDark ? 2 : 30,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
    >
      <View style={[
        styles.toggleTrack,
        {
          backgroundColor: isDark ? theme.primary : theme.surfaceSecondary,
          borderColor: isDark ? theme.primary : theme.border,
        },
      ]}>
        <Text style={[styles.trackIconLeft, {
          color: isDark ? theme.textInverse : theme.textMuted,
          opacity: isDark ? 0.5 : 1,
        }]}>✦</Text>
        <Text style={[styles.trackIconRight, {
          color: theme.textMuted,
          opacity: isDark ? 1 : 0.4,
        }]}>☽</Text>
        <Animated.View style={[
          styles.toggleKnob,
          {
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            shadowColor: '#000',
            transform: [{ translateX }],
          },
        ]}>
          <Text style={[styles.knobIcon, { color: theme.textPrimary }]}>
            {isDark ? '☽' : '✦'}
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// ─── SettingsScreen ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
      </View>

      {/* Settings list */}
      <View style={styles.content}>

        {/* Appearance section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Dark mode row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.rowIcon, { color: theme.textSecondary }]}>
                  {isDark ? '☽' : '✦'}
                </Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
                <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
            </View>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} theme={theme} />
          </View>
        </View>

        {/* About section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 24 }]}>ABOUT</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.rowIcon, { color: theme.textSecondary }]}>◈</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Travel Diary</Text>
                <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  content: {
    padding: 20,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: { fontSize: 16 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSubtitle: { fontSize: 12 },

  // Toggle
  toggleTrack: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    overflow: 'hidden',
  },
  trackIconLeft: { fontSize: 12, width: 14, textAlign: 'center' },
  trackIconRight: { fontSize: 12, width: 14, textAlign: 'center' },
  toggleKnob: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  knobIcon: { fontSize: 13 },
});