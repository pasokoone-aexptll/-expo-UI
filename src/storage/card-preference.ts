import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CardId } from '@/types';

const LAST_CARD_KEY = 'dreamcloud:last-card';

export async function readLastCard(): Promise<CardId | null> {
  const storedValue = await AsyncStorage.getItem(LAST_CARD_KEY);
  if (storedValue === 'profile' || storedValue === 'scanner') return storedValue;
  return null;
}

export function writeLastCard(card: CardId): Promise<void> {
  return AsyncStorage.setItem(LAST_CARD_KEY, card);
}

export function clearLastCard(): Promise<void> {
  return AsyncStorage.removeItem(LAST_CARD_KEY);
}