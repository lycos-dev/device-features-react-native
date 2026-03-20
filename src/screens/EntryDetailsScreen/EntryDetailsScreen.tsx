import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context';
import { RootStackParamList, RootStackNavigationProp } from '../../navigation';
import { deleteEntry } from '../../services';

type EntryDetailsRouteProp = RouteProp<RootStackParamList, 'EntryDetails'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

// Minimalist trash icon — same as EntryCard
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

  const { entry } = route.params;
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Load natural image dimensions so we can display at full resolution
  useEffect(() => {
    Image.getSize(
      entry.imageUri,
      (w, h) => setImageSize({ width: w, height: h }),
      () => setImageSize(null)
    );
  }, [entry.imageUri]);

  // Compute display height that preserves original aspect ratio
  const imageDisplayWidth = SCREEN_WIDTH - 32;
  const imageDisplayHeight = imageSize
    ? Math.round((imageDisplayWidth / imageSize.width) * imageSize.height)
    : imageDisplayWidth; // fallback square until dimensions load

  const formattedDate = (() => {
    try {
      const d = new Date(entry.createdAt);
      return {
        date: d.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    } catch {
      return { date: entry.createdAt, time: '' };
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
              Alert.alert(
                'Delete Failed',
                err instanceof Error ? err.message : 'Could not delete entry.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: theme.surfaceSecondary }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={[styles.headerBtnText, { color: theme.textPrimary }]}>←</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Entry</Text>

        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.headerBtn, { backgroundColor: theme.errorLight }]}
          accessibilityLabel="Delete entry"
          accessibilityRole="button"
        >
          <TrashIcon color={theme.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image */}
        <View style={[styles.imageWrapper, { borderColor: theme.border }]}>
          {imageError ? (
            <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSecondary, height: imageDisplayHeight }]}>
              <Text style={[styles.fallbackSymbol, { color: theme.textMuted }]}>⊘</Text>
              <Text style={[styles.fallbackText, { color: theme.textMuted }]}>
                Image unavailable
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: entry.imageUri }}
              style={{ width: imageDisplayWidth, height: imageDisplayHeight }}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}
        </View>

        {/* Details card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          {/* Address row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.iconSymbol, { color: theme.textSecondary }]}>◎</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Location</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {entry.address || 'Unknown location'}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          {/* Date row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.iconSymbol, { color: theme.textSecondary }]}>◷</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Date</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {formattedDate.date}
              </Text>
              {formattedDate.time ? (
                <Text style={[styles.detailSubValue, { color: theme.textMuted }]}>
                  {formattedDate.time}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          {/* ID row */}
          <View style={styles.detailRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSecondary }]}>
              <Text style={[styles.iconSymbol, { color: theme.textSecondary }]}>#</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Entry ID</Text>
              <Text
                style={[styles.detailValueMono, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {entry.id}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 18 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Image
  imageWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },

  imageFallback: {
    width: SCREEN_WIDTH - 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackSymbol: { fontSize: 32 },
  fallbackText: { fontSize: 13 },

  // Details card
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  iconSymbol: { fontSize: 15 },
  detailContent: { flex: 1, gap: 3 },
  detailLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  detailSubValue: { fontSize: 12, lineHeight: 18 },
  detailValueMono: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});