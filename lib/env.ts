/**
 * Environment variable validation using Zod
 * Validates all required environment variables at startup
 *
 * Security: CWE-1188 - Ensures proper initialization of resources
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverEnvSchema = z.object({
  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),

  // Stripe
  STRIPE: z.string().min(1, 'STRIPE API key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK: z
    .string()
    .min(1, 'STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK is required'),
  STRIPE_BOBBY_PRICE_ID_HERO_PACK: z
    .string()
    .min(1, 'STRIPE_BOBBY_PRICE_ID_HERO_PACK is required'),
  STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN: z
    .string()
    .min(1, 'STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN is required'),
  STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN: z
    .string()
    .min(1, 'STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN is required'),

  // Deepgram
  DEEPGRAM_API_KEY: z.string().min(1, 'DEEPGRAM_API_KEY is required'),

  // Session encryption (for secure server-side session storage)
  SESSION_ENCRYPTION_KEY: z
    .string()
    .min(1, 'SESSION_ENCRYPTION_KEY is required for secure session storage'),

  // Upstash Redis (optional - falls back to in-memory if not set)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser (prefixed with NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate server environment variables
 * Call this at application startup to fail fast on misconfiguration
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`❌ Invalid server environment variables:\n${errors}`);
  }

  return result.data;
}

/**
 * Validate client environment variables
 */
export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    logger.warn(`⚠️ Invalid client environment variables:\n${errors}`);
  }

  return result.data as ClientEnv;
}

/**
 * Get a validated server environment variable
 * Throws if the variable is not set or invalid
 */
export function getServerEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  const value = process.env[key];
  const schema = serverEnvSchema.shape[key];

  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid environment variable ${key}: ${result.error.message}`
    );
  }

  return result.data as ServerEnv[K];
}

/**
 * Check if Upstash Redis is configured
 */
export function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
