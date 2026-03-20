import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelEntry } from '../types';

const STORAGE_KEY = '@travel_diary_entries';

const isValidEntry = (e: unknown): e is TravelEntry =>
  typeof e === 'object' &&
  e !== null &&
  typeof (e as TravelEntry).id === 'string' &&
  typeof (e as TravelEntry).imageUri === 'string' &&
  typeof (e as TravelEntry).address === 'string' &&
  typeof (e as TravelEntry).createdAt === 'string';

export const getEntries = async (): Promise<TravelEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[StorageService] Corrupt data detected — resetting storage.');
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Filter out any malformed entries to prevent crashes
    const valid = parsed.filter(isValidEntry);
    if (valid.length !== parsed.length) {
      console.warn(
        `[StorageService] Removed ${parsed.length - valid.length} malformed entries.`
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid;
  } catch (error) {
    console.error('[StorageService] Failed to load entries:', error);
    return [];
  }
};

export const saveEntry = async (entry: TravelEntry): Promise<void> => {
  if (!isValidEntry(entry)) {
    throw new Error('Invalid entry: all fields (id, imageUri, address, createdAt) are required.');
  }

  try {
    const existing = await getEntries();

    if (existing.some(e => e.id === entry.id)) {
      throw new Error(`Entry with id "${entry.id}" already exists.`);
    }

    // Newest first
    const updated = [entry, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('[StorageService] Failed to save entry.');
  }
};

export const updateEntry = async (updated: TravelEntry): Promise<void> => {
  if (!isValidEntry(updated)) {
    throw new Error('Invalid entry: all fields (id, imageUri, address, createdAt) are required.');
  }

  try {
    const existing = await getEntries();
    const index = existing.findIndex(e => e.id === updated.id);

    if (index === -1) {
      throw new Error(`Entry with id "${updated.id}" not found.`);
    }

    existing[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('[StorageService] Failed to update entry.');
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  if (!id?.trim()) {
    throw new Error('A valid entry id is required to delete.');
  }

  try {
    const existing = await getEntries();

    if (!existing.some(e => e.id === id)) {
      throw new Error(`Entry with id "${id}" not found.`);
    }

    const updated = existing.filter(e => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('[StorageService] Failed to delete entry.');
  }
};

export const clearAllEntries = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[StorageService] Failed to clear entries:', error);
  }
};