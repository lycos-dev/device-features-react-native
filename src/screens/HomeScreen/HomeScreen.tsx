import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle, theme }) => {
  const translateX = useRef(new Animated.Value(isDark ? 30 : 2)).current;

  const handlePress = () => {
    Animated.spring(translateX, {
      toValue: isDark ? 2 : 30,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
    >
      <View
        style={[
          styles.toggleTrack,
          {
            backgroundColor: isDark ? theme.primary : theme.surfaceSecondary,
            borderColor: isDark ? theme.primary : theme.border,
          },
        ]}
      >
        <Text style={[styles.trackIconLeft, { color: isDark ? theme.textInverse : theme.textMuted, opacity: isDark ? 0.5 : 1 }]}>
          ✦
        </Text>
        <Text style={[styles.trackIconRight, { color: theme.textMuted, opacity: isDark ? 1 : 0.4 }]}>
          ☽
        </Text>
        <Animated.View
          style={[
            styles.toggleKnob,
            {
              backgroundColor: isDark ? theme.surface : '#FFFFFF',
              shadowColor: '#000',
              transform: [{ translateX }],
            },
          ]}
        >
          <Text style={[styles.knobIcon, { color: theme.textPrimary }]}>
            {isDark ? '☽' : '✦'}
          </Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { theme, isDark, toggleTheme } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <ThemedText variant="h2" style={{ color: theme.textPrimary }}>
            Travel Diary
          </ThemedText>
          {!loading && !error && (
            <Text style={[styles.entryCount, { color: theme.textMuted }]}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          )}
        </View>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} theme={theme} />
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.fabBackground, shadowColor: theme.fabShadow }]}
        onPress={() => navigation.navigate('AddEntry')}
        activeOpacity={0.8}
        accessibilityLabel="Add new travel entry"
        accessibilityRole="button"
      >
        <Text style={[styles.fabSymbol, { color: theme.fabIcon }]}>+</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { gap: 2 },
  entryCount: { fontSize: 12 },
  toggleTrack: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    overflow: 'hidden',
  },
  trackIconLeft: { fontSize: 12, width: 14, textAlign: 'center' },
  trackIconRight: { fontSize: 12, width: 14, textAlign: 'center' },
  toggleKnob: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  knobIcon: { fontSize: 13 },
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
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabSymbol: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
});