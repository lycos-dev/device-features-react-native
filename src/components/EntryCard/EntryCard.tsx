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
        month: 'long',
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
      'Are you sure you want to delete this travel entry? This action cannot be undone.',
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
        <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary }]}>
          <Text style={styles.imageFallbackText}>📷 Image unavailable</Text>
        </View>
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.icon}>📍</Text>
            <Text
              style={[styles.address, { color: theme.textPrimary }]}
              numberOfLines={2}
            >
              {address || 'Unknown location'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.icon}>🗓</Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>{formattedDate}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.errorLight }]}
          onPress={handleDelete}
          accessibilityLabel="Delete entry"
          accessibilityRole="button"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  imageFallback: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  icon: {
    fontSize: 14,
    marginTop: 1,
  },
  address: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    lineHeight: 18,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
});
