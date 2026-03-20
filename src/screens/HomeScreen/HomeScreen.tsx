import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, EntryCard } from '../../components';
import { useTheme } from '../../context';
import { RootStackNavigationProp } from '../../navigation';
import { deleteEntry, getEntries } from '../../services';
import { TravelEntry } from '../../types';

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar: React.FC<{
  entries: TravelEntry[];
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ entries, theme }) => {
  const total = entries.length;
  const lastEntry = entries[0];
  const lastDate = lastEntry
    ? new Date(lastEntry.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <View style={[styles.statsBar, { borderBottomColor: theme.border }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{total}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>Entries</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{lastDate}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>Last entry</Text>
      </View>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  count: number;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ count, theme }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent</Text>
    <View style={[styles.sectionBadge, { backgroundColor: theme.surfaceSecondary }]}>
      <Text style={[styles.sectionBadgeText, { color: theme.textSecondary }]}>{count}</Text>
    </View>
  </View>
);

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { theme } = useTheme();

  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = await getEntries();
      setEntries(stored);
    } catch {
      setError('Failed to load entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      Alert.alert(
        'Delete Failed',
        err instanceof Error ? err.message : 'Could not delete entry.'
      );
    }
  };

  const handlePressEntry = (item: TravelEntry) => {
    navigation.navigate('EntryDetails', { entry: item });
  };

  const renderEntry = ({ item }: { item: TravelEntry }) => (
    <EntryCard
      id={item.id}
      imageUri={item.imageUri}
      address={item.address}
      createdAt={item.createdAt}
      onDelete={handleDelete}
      onPress={() => handlePressEntry(item)}
      theme={theme}
    />
  );

  const renderHeader = () => (
    <>
      {entries.length > 0 && <StatsBar entries={entries} theme={theme} />}
      {entries.length > 0 && <SectionHeader count={entries.length} theme={theme} />}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Travel Diary
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Your memories, mapped.
          </Text>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.textMuted} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading entries...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorSymbol, { color: theme.textMuted }]}>⊘</Text>
          <Text style={[styles.errorText, { color: theme.textMuted }]}>{error}</Text>
          <TouchableOpacity
            onPress={loadEntries}
            style={[styles.retryButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.retryText, { color: theme.textSecondary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.id}
          renderItem={renderEntry}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={
            entries.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.1,
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  listContent: { paddingTop: 8, paddingBottom: 120 },
  emptyContainer: { flex: 1 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  loadingText: { fontSize: 13, marginTop: 4 },
  errorSymbol: { fontSize: 28 },
  errorText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: { fontSize: 13, fontWeight: '500' },
});