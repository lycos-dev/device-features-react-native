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

import { EmptyState, EntryCard, ThemedText } from '../../components';
import { useTheme } from '../../context';
import { RootStackNavigationProp } from '../../navigation';
import { deleteEntry, getEntries } from '../../services';
import { TravelEntry } from '../../types';

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText variant="h2" style={{ color: theme.textPrimary }}>
          Travel Diary
        </ThemedText>
        {!loading && !error && (
          <Text style={[styles.entryCount, { color: theme.textMuted }]}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.textMuted} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorSymbol, { color: theme.textMuted }]}>⊘</Text>
          <ThemedText variant="bodySmall" style={{ color: theme.textMuted, textAlign: 'center' }}>
            {error}
          </ThemedText>
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
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  entryCount: { fontSize: 12 },
  listContent: { paddingTop: 8, paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorSymbol: { fontSize: 28 },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryText: { fontSize: 13, fontWeight: '500' },
});