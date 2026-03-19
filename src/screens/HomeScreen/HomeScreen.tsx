import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmptyState, EntryCard, ThemedText } from '../../components';
import { deleteEntry, getEntries } from '../../services';
import { TravelEntry } from '../../types';
import { RootStackNavigationProp } from '../../navigation';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reload entries every time the screen comes into focus
  // (handles returning from AddEntryScreen after saving)
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
    } catch (err) {
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
        err instanceof Error ? err.message : 'Could not delete entry. Please try again.'
      );
    }
  };

  const handleAddEntry = () => {
    navigation.navigate('AddEntry');
  };

  const renderEntry = ({ item }: { item: TravelEntry }) => (
    <EntryCard
      id={item.id}
      imageUri={item.imageUri}
      address={item.address}
      createdAt={item.createdAt}
      onDelete={handleDelete}
    />
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <ThemedText variant="caption" color="muted">
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText variant="h1">Travel Diary</ThemedText>
          <ThemedText variant="bodySmall" color="muted">
            Your memories, mapped.
          </ThemedText>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <ThemedText variant="bodySmall" color="muted" style={styles.loadingText}>
            Loading your entries...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <ThemedText variant="body" color="error" align="center">
            {error}
          </ThemedText>
          <TouchableOpacity onPress={loadEntries} style={styles.retryButton}>
            <ThemedText variant="label" color="primary">
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.id}
          renderItem={renderEntry}
          ListHeaderComponent={entries.length > 0 ? renderHeader : null}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={
            entries.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — Add Entry */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddEntry}
        activeOpacity={0.85}
        accessibilityLabel="Add new travel entry"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 8,
  },
  errorEmoji: {
    fontSize: 40,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#F1F0FF',
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});