import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../context';

const { width: W, height: H } = Dimensions.get('window');

// ─── Background art — stacked circles for a world/globe feel ─────────────────
const BackgroundArt: React.FC<{ theme: ReturnType<typeof useTheme>['theme'] }> = ({ theme }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {/* Large outer ring */}
    <View style={[styles.ring, styles.ring1, { borderColor: theme.border, opacity: 0.5 }]} />
    {/* Medium ring */}
    <View style={[styles.ring, styles.ring2, { borderColor: theme.border, opacity: 0.4 }]} />
    {/* Small ring */}
    <View style={[styles.ring, styles.ring3, { borderColor: theme.border, opacity: 0.3 }]} />
    {/* Horizontal line (equator) */}
    <View style={[styles.equator, { backgroundColor: theme.border, opacity: 0.25 }]} />
    {/* Vertical line (meridian) */}
    <View style={[styles.meridian, { backgroundColor: theme.border, opacity: 0.25 }]} />
    {/* Dot cluster — scattered location pins */}
    {[
      { top: H * 0.18, left: W * 0.22 },
      { top: H * 0.28, left: W * 0.68 },
      { top: H * 0.42, left: W * 0.15 },
      { top: H * 0.38, left: W * 0.75 },
      { top: H * 0.55, left: W * 0.55 },
      { top: H * 0.62, left: W * 0.3  },
    ].map((pos, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          { top: pos.top, left: pos.left, backgroundColor: theme.textMuted, opacity: 0.25 },
        ]}
      />
    ))}
  </View>
);

export interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No entries yet',
  subtitle = 'Your travels will appear here.\nTap + to add your first memory.',
}) => {
  const { theme } = useTheme();

  // Pulse animation on the center icon
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Gentle infinite pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <BackgroundArt theme={theme} />

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Center globe icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              transform: [{ scale: pulse }],
            },
          ]}
        >
          {/* Mini globe lines inside */}
          <View style={[styles.globeRing, { borderColor: theme.textMuted }]} />
          <View style={[styles.globeHLine, { backgroundColor: theme.textMuted }]} />
          <View style={[styles.globeVLine, { backgroundColor: theme.textMuted }]} />
          {/* Center dot */}
          <View style={[styles.globeCenter, { backgroundColor: theme.textPrimary }]} />
        </Animated.View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        </View>

        {/* Arrow hint pointing down toward FAB */}
        <View style={styles.hintRow}>
          <View style={[styles.hintLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>tap + to begin</Text>
          <View style={[styles.hintLine, { backgroundColor: theme.border }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const GLOBE_SIZE = 96;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background art
  ring: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9999,
    alignSelf: 'center',
  },
  ring1: {
    width: W * 0.85,
    height: W * 0.85,
    top: H * 0.5 - W * 0.425,
  },
  ring2: {
    width: W * 0.58,
    height: W * 0.58,
    top: H * 0.5 - W * 0.29,
  },
  ring3: {
    width: W * 0.32,
    height: W * 0.32,
    top: H * 0.5 - W * 0.16,
  },
  equator: {
    position: 'absolute',
    width: W * 0.85,
    height: StyleSheet.hairlineWidth,
    top: H * 0.5,
    alignSelf: 'center',
  },
  meridian: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    height: W * 0.85,
    top: H * 0.5 - W * 0.425,
    alignSelf: 'center',
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Content
  content: {
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 40,
  },

  // Globe icon
  iconWrap: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeRing: {
    position: 'absolute',
    width: GLOBE_SIZE * 0.65,
    height: GLOBE_SIZE * 0.65,
    borderRadius: GLOBE_SIZE,
    borderWidth: 1,
    opacity: 0.5,
  },
  globeHLine: {
    position: 'absolute',
    width: GLOBE_SIZE * 0.7,
    height: 1,
    opacity: 0.4,
  },
  globeVLine: {
    position: 'absolute',
    width: 1,
    height: GLOBE_SIZE * 0.7,
    opacity: 0.4,
  },
  globeCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Text
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    maxWidth: 40,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});