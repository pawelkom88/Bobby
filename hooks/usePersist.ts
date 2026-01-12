/**
 * Hook for persisting state to localStorage
 */

import { useEffect } from 'react';
import {logger} from "@/lib/logger";

/**
 * Persist state to localStorage
 */
export function usePersist<T>(
  key: string,
  value: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): void {
  useEffect(() => {
    try {
      const serializedValue = options?.serialize
        ? options.serialize(value)
        : JSON.stringify(value);

      if (typeof window !== 'undefined') {
        localStorage.setItem(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Error persisting "${key}" to localStorage:`, error);
    }
  }, [key, value, options]);
}

/**
 * Retrieve persisted state from localStorage
 */
export function useRetrievePersist<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): T {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    return options?.deserialize ? options.deserialize(item) : JSON.parse(item);
  } catch (error) {
    logger.error(`Error retrieving "${key}" from localStorage:`, error);
    return defaultValue;
  }
}
