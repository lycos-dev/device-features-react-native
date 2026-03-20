import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Theme } from '../../constants';

export interface EntryCardProps {
  id: string;
  imageUri: string;
  address: string;
  createdAt: string;
  onDelete: (id: string) => void;
  onPress: () => void;
  theme: Theme;
}

// Minimalist trash can — no SVG dependency
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
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return createdAt;
    }
  })();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.974,
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
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.cardShadow,
            borderColor: theme.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Photo */}
        {imageError ? (
          <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.fallbackSymbol, { color: theme.textMuted }]}>⊘</Text>
            <Text style={[styles.fallbackText, { color: theme.textMuted }]}>Image unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Footer row */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.info}>
            <View style={styles.row}>
              <Text style={[styles.symbol, { color: theme.primary }]}>◎</Text>
              <Text
                style={[styles.address, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {address || 'Unknown location'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.symbol, { color: theme.textMuted }]}>◷</Text>
              <Text style={[styles.date, { color: theme.textMuted }]}>{formattedDate}</Text>
            </View>
          </View>

          {/* Delete button */}
          <TouchableOpacity
            style={[styles.deleteButton, { borderLeftColor: theme.border }]}
            onPress={handleDelete}
            activeOpacity={0.5}
            accessibilityLabel="Delete entry"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <TrashIcon color={theme.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: '100%', height: 210 },
  imageFallback: {
    width: '100%',
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackSymbol: { fontSize: 26 },
  fallbackText: { fontSize: 13 },
  footer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  symbol: {
    fontSize: 13,
    width: 14,
    textAlign: 'center',
  },
  address: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  date: { fontSize: 12, letterSpacing: 0.1 },
  deleteButton: {
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});