import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Theme } from '../../constants';

const { width: W } = Dimensions.get('window');

export interface EntryCardProps {
  id: string;
  imageUri: string;
  address: string;
  createdAt: string;
  onDelete: (id: string) => void;
  onPress: () => void;
  theme: Theme;
}

const TrashIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: 'center', gap: 1 }}>
    <View style={{ width: 13, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 5, height: 1.5, backgroundColor: color, borderRadius: 1, marginTop: -3, marginBottom: 1 }} />
    <View style={{
      width: 11, height: 12,
      borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5,
      borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
      flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
      paddingHorizontal: 2,
    }}>
      <View style={{ width: 1.5, height: 6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 1.5, height: 6, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);

export const EntryCard: React.FC<EntryCardProps> = ({
  id,
  imageUri,
  address,
  createdAt,
  onDelete,
  onPress,
  theme,
}) => {
  const [imageError, setImageError] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const formattedDate = (() => {
    try {
      return new Date(createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch { return ''; }
  })();

  const formattedTime = (() => {
    try {
      return new Date(createdAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch { return ''; }
  })();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'This entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.card,
        {
          shadowColor: theme.cardShadow,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
        {/* ── Photo ── */}
        {imageError ? (
          <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.fallbackSymbol, { color: theme.textMuted }]}>⊘</Text>
            <Text style={[styles.fallbackText, { color: theme.textMuted }]}>
              Image unavailable
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* ── Gradient overlay — simulated with stacked Views ── */}
        <View style={styles.gradientOverlay}>
          {/* Top layer — very subtle dark for delete button visibility */}
          <View style={styles.gradientTop} />
          {/* Bottom layer — stronger dark for text readability */}
          <View style={styles.gradientBottom} />
        </View>

        {/* ── Top row — delete button ── */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Delete entry"
          >
            <TrashIcon color="#FF4444" />
          </TouchableOpacity>
        </View>

        {/* ── Bottom row — address + date/time ── */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <View style={styles.locationRow}>
              <Text style={styles.locationDot}>◎</Text>
              <Text style={styles.address} numberOfLines={1}>
                {address || 'Unknown location'}
              </Text>
            </View>
            <Text style={styles.date}>
              {formattedDate}
              {formattedTime ? `  ·  ${formattedTime}` : ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const IMAGE_HEIGHT = W * 0.75;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: IMAGE_HEIGHT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackSymbol: { fontSize: 32 },
  fallbackText: { fontSize: 13 },

  // Gradient simulation — two overlapping semi-transparent layers
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    display: 'none',
    height: 0,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  // Top row — delete button top-right
  topRow: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Bottom row — text info
  bottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 18,
  },
  bottomLeft: {
    gap: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationDot: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  address: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
    marginLeft: 19, // align with address text (after the ◎ icon)
  },
});