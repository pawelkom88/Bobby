import 'server-only';

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { logger } from './logger';

/**
 * Firebase Admin SDK initialization for server-side operations
 * Used for:
 * - Verifying Firebase ID tokens
 * - Server-side Firestore operations (e.g., adding credits)
 */

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Use JSON-based service account credentials (more reliable)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    logger.log('FIREBASE_SERVICE_ACCOUNT environment variable is required.');
    throw new Error('FIREBASE_SERVICE_ACCOUNT is required');
  }

  try {
    // Parse the JSON service account
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Ensure private key has proper newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        '\n'
      );
    }

    // Initialize Firebase Admin with parsed service account credentials
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    logger.error(
      'Failed to initialize Firebase Admin SDK:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 * Used for verifying ID tokens from client requests
 */
export function getAdminAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance
 * Used for server-side database operations (e.g., adding credits after payment)
 */
export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}

/**
 * Verify a Firebase ID token and return the decoded token
 * @param idToken - The Firebase ID token from the client
 * @returns The decoded token containing user information (uid, email, etc.)
 * @throws Error if token is invalid or expired
 */
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  return auth.verifyIdToken(idToken);
}
