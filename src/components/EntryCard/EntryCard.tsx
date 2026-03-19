import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface EntryCardProps {
  id: string;
  imageUri: string;
  address: string;
  createdAt: string;
  onDelete: (id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  id,
  imageUri,
  address,
  createdAt,
  onDelete,
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
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(id),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Photo */}
      {imageError ? (
        <View style={styles.imageFallback}>
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
          {/* Address */}
          <View style={styles.row}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.address} numberOfLines={2}>
              {address || 'Unknown location'}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.row}>
            <Text style={styles.icon}>🗓</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
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
    backgroundColor: '#F0F0F0',
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
    color: '#1A1A1A',
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  deleteIcon: {
    fontSize: 18,
  },
});