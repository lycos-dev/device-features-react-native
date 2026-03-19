import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelEntry } from '../types';

const STORAGE_KEY = '@travel_diary_entries';

export const getEntries = async (): Promise<TravelEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      console.warn('[StorageService] Stored data is not an array — resetting.');
      return [];
    }

    return parsed as TravelEntry[];
  } catch (error) {
    console.error(
      '[StorageService] Failed to load entries:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
};

export const saveEntry = async (entry: TravelEntry): Promise<void> => {
  if (!entry.id || !entry.imageUri || !entry.address || !entry.createdAt) {
    throw new Error('Invalid entry: all fields (id, imageUri, address, createdAt) are required.');
  }

  try {
    const existing = await getEntries();

    const isDuplicate = existing.some(e => e.id === entry.id);
    if (isDuplicate) {
      throw new Error(`Entry with id "${entry.id}" already exists.`);
    }

    // Prepend new entry so the list shows newest first
    const updated = [entry, ...existing];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('[StorageService] Failed to save entry.');
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  if (!id || id.trim() === '') {
    throw new Error('A valid entry id is required to delete.');
  }

  try {
    const existing = await getEntries();

    const entryExists = existing.some(e => e.id === id);
    if (!entryExists) {
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
    console.error(
      '[StorageService] Failed to clear entries:',
      error instanceof Error ? error.message : error
    );
  }
};