import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform key-value storage with the same API surface as
 * expo-secure-store. SecureStore has no web implementation, so on web
 * we fall back to localStorage (same pattern as services/supabase.ts).
 */
export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
};
