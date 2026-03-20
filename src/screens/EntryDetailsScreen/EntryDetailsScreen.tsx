import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context';
import { RootStackParamList, RootStackNavigationProp } from '../../navigation';
import { deleteEntry } from '../../services';

type EntryDetailsRouteProp = RouteProp<RootStackParamList, 'EntryDetails'>;

const { width: W, height: H } = Dimensions.get('window');
const IMAGE_HEIGHT = H * 0.52; // fallback, overridden by actual ratio

// ─── Trash icon ───────────────────────────────────────────────────────────────
const TrashIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: 'center', gap: 1 }}>
    <View style={{ width: 14, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1, marginTop: -3, marginBottom: 1 }} />
    <View style={{
      width: 12, height: 13,
      borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5,
      borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
      flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
      paddingHorizontal: 2,
    }}>
      <View style={{ width: 1.5, height: 7, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 1.5, height: 7, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);

export const EntryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<EntryDetailsRouteProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { entry } = route.params;
  const [imageError, setImageError] = useState(false);
  const [imageHeight, setImageHeight] = useState(H * 0.52);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Back button fades from white → themed as user scrolls past image
  const btnBg = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT * 0.5],
    outputRange: ['rgba(0,0,0,0.38)', theme.surfaceSecondary],
    extrapolate: 'clamp',
  });
  const btnTextColor = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT * 0.5],
    outputRange: ['#FFFFFF', theme.textPrimary],
    extrapolate: 'clamp',
  });

  // Title bar slides up from bottom of image on scroll
  const titleBarY = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT * 0.3],
    outputRange: [0, -IMAGE_HEIGHT * 0.1],
    extrapolate: 'clamp',
  });

  const formattedDate = (() => {
    try {
      const d = new Date(entry.createdAt);
      return {
        full: d.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        short: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    } catch {
      return { full: entry.createdAt, time: '', short: entry.createdAt };
    }
  })();

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'This entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Delete Failed', err instanceof Error ? err.message : 'Could not delete.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero image ── */}
        <View style={styles.imageContainer}>
          {imageError ? (
            <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.fallbackSymbol, { color: theme.textMuted }]}>⊘</Text>
              <Text style={[styles.fallbackText, { color: theme.textMuted }]}>Image unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: entry.imageUri }}
              style={[styles.image, { height: imageHeight }]}
              resizeMode="cover"
              onLoad={e => {
                const { width: iw, height: ih } = e.nativeEvent.source;
                setImageHeight(Math.round((W / iw) * ih));
              }}
              onError={() => setImageError(true)}
            />
          )}

          {/* Dark gradient at bottom of image */}
          <View style={styles.imageGradient} />

          {/* ── Title bar — overlaid on image bottom ── */}
          <Animated.View
            style={[styles.titleBar, { transform: [{ translateY: titleBarY }] }]}
          >
            {/* Issue number / entry tag */}
            <View style={styles.issueBadge}>
              <Text style={styles.issueDot}>◈</Text>
              <Text style={styles.issueText}>
                {formattedDate.short}
              </Text>
            </View>

            {/* Location headline */}
            <Text style={styles.locationHeadline} numberOfLines={2}>
              {entry.address || 'Unknown location'}
            </Text>
          </Animated.View>
        </View>

        {/* ── Content below image ── */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>

          {/* Thin rule */}
          <View style={[styles.rule, { backgroundColor: theme.border }]} />

          {/* Date + time row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>DATE</Text>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {formattedDate.full}
              </Text>
            </View>
            <View style={[styles.metaVertDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>TIME</Text>
              <Text style={[styles.metaValue, { color: theme.textPrimary }]}>
                {formattedDate.time || '—'}
              </Text>
            </View>
          </View>

          <View style={[styles.rule, { backgroundColor: theme.border }]} />

          {/* Full address block */}
          <View style={styles.addressBlock}>
            <Text style={[styles.blockLabel, { color: theme.textMuted }]}>LOCATION</Text>
            <View style={styles.addressRow}>
              <Text style={[styles.addressDot, { color: theme.textSecondary }]}>◎</Text>
              <Text style={[styles.addressFull, { color: theme.textPrimary }]}>
                {entry.address || 'Unknown location'}
              </Text>
            </View>
          </View>

          <View style={[styles.rule, { backgroundColor: theme.border }]} />

          {/* Entry ID */}
          <View style={[styles.idBlock, { paddingBottom: insets.bottom + 40 }]}>
            <Text style={[styles.blockLabel, { color: theme.textMuted }]}>REF</Text>
            <Text style={[styles.idText, { color: theme.textMuted }]} numberOfLines={1}>
              {entry.id}
            </Text>
          </View>

        </View>
      </Animated.ScrollView>

      {/* ── Back button — sticky top left ── */}
      <Animated.View
        style={[
          styles.backBtnWrap,
          { top: insets.top + 12 },
        ]}
      >
        <Animated.View style={[styles.backBtn, { backgroundColor: btnBg }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtnInner}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <Animated.Text style={[styles.backBtnText, { color: btnTextColor }]}>
              ←
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── Delete button — sticky top right ── */}
      <View style={[styles.deleteBtnWrap, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityLabel="Delete entry"
        >
          <TrashIcon color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Image
  imageContainer: {
    width: W,
    overflow: 'hidden',
  },
  image: {
    width: W,
  },
  imageFallback: {
    width: '100%',
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackSymbol: { fontSize: 32 },
  fallbackText: { fontSize: 13 },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  // Title bar on image
  titleBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 8,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  issueDot: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  issueText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  locationHeadline: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Content
  content: {
    paddingHorizontal: 20,
  },

  rule: {
    height: StyleSheet.hairlineWidth,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 20,
    gap: 16,
  },
  metaItem: {
    flex: 1,
    gap: 5,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  metaVertDivider: {
    width: StyleSheet.hairlineWidth,
  },

  // Address block
  addressBlock: {
    paddingVertical: 20,
    gap: 8,
  },
  blockLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressDot: { fontSize: 15, marginTop: 1 },
  addressFull: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },

  // ID block
  idBlock: {
    paddingTop: 20,
    gap: 6,
  },
  idText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },

  // Back button
  backBtnWrap: {
    position: 'absolute',
    left: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backBtnInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '400',
  },

  // Delete button
  deleteBtnWrap: {
    position: 'absolute',
    right: 16,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});