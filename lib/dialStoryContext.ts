import type { AgeTier, Service } from '@/types';

export interface DialStoryContext {
  ageTier?: AgeTier;
  service?: Service;
  storedAt?: string;
}

const STORAGE_KEY = 'bobby-dial-story-context';

const canAccessSessionStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

export function persistDialStoryContext(context: DialStoryContext): void {
  if (!canAccessSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...context, storedAt: new Date().toISOString() })
    );
  } catch (error) {
    // Session storage might be full or restricted; fail silently
  }
}

export function getDialStoryContext(): DialStoryContext | null {
  if (!canAccessSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function clearDialStoryContext(): void {
  if (!canAccessSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore
  }
}
