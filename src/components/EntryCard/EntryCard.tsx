import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Theme } from '../../constants';

export interface EntryCardProps {
  id: string;
  imageUri: string;
  address: string;
  createdAt: string;
  onDelete: (id: string) => void;
  theme: Theme;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  id,
  imageUri,
  address,
  createdAt,
  onDelete,
  theme,
}) => {
  const [imageError, setImageError] = useState(false);

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
    <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow }]}>
      {/* Photo */}
      {imageError ? (
        <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <Text style={[styles.fallbackIcon, { color: theme.textMuted }]}>⊘</Text>
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

      {/* Content row */}
      <View style={[styles.content, { borderTopWidth: 1, borderTopColor: theme.border }]}>
        <View style={styles.info}>
          {/* Address */}
          <View style={styles.row}>
            <Text style={[styles.symbol, { color: theme.textMuted }]}>◎</Text>
            <Text style={[styles.address, { color: theme.textPrimary }]} numberOfLines={1}>
              {address || 'Unknown location'}
            </Text>
          </View>
          {/* Date */}
          <View style={styles.row}>
            <Text style={[styles.symbol, { color: theme.textMuted }]}>◷</Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>{formattedDate}</Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderLeftWidth: 1, borderLeftColor: theme.border }]}
          onPress={handleDelete}
          accessibilityLabel="Delete entry"
          accessibilityRole="button"
          activeOpacity={0.6}
        >
          <Text style={[styles.deleteSymbol, { color: theme.textMuted }]}>⊗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 220,
  },
  imageFallback: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackIcon: {
    fontSize: 28,
  },
  fallbackText: {
    fontSize: 13,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
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
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSymbol: {
    fontSize: 18,
  },
});