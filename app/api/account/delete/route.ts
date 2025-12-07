import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/token-verifier';
import { extractBearerToken } from '@/lib/auth-utils';
import { clearAllSessionValues } from '@/lib/session-storage';
import { logger } from '@/lib/logger';

const auth = getAdminAuth();
const db = getAdminDb();

const BATCH_SIZE = 500;

interface DeleteAccountResponse {
  success: boolean;
  error?: string;
  message?: string;
}

async function verifyUserFromToken(
  request: NextRequest
): Promise<{ userId: string } | { error: string; status: number }> {
  const tokenResult = extractBearerToken(request);

  if (!tokenResult.success) {
    logger.warn('Token extraction failed', {
      error: tokenResult.error,
      endpoint: 'account/delete',
    });
    return { error: tokenResult.message, status: 401 };
  }

  try {
    const result = await verifyToken(
      token => auth.verifyIdToken(token),
      tokenResult.token
    );

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    return { userId: result.uid };
  } catch (error: any) {
    logger.warn('Token verification error:', error.code);

    if (error.code === 'auth/id-token-expired') {
      return { error: 'Token has expired', status: 401 };
    }
    if (error.code === 'auth/id-token-revoked') {
      return { error: 'Token has been revoked', status: 401 };
    }

    return { error: 'Invalid token', status: 401 };
  }
}

async function deleteUserDocumentsFromCollection(
  collectionName: string,
  userId: string
): Promise<number> {
  let deletedCount = 0;

  try {
    const querySnapshot = await db
      .collection(collectionName)
      .where('userId', '==', userId)
      .get();

    if (querySnapshot.empty) {
      logger.log(`No documents found in ${collectionName} for user ${userId}`);
      return 0;
    }

    const docs = querySnapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + BATCH_SIZE);

      for (const doc of batchDocs) {
        batch.delete(doc.ref);
      }

      await batch.commit();
      deletedCount += batchDocs.length;
    }

    logger.log(
      `Deleted ${deletedCount} documents from ${collectionName} for user ${userId}`
    );
    return deletedCount;
  } catch (error) {
    logger.error(`Error deleting from ${collectionName}:`, error);
    throw error;
  }
}

async function deleteUserDocument(userId: string): Promise<void> {
  try {
    await db.collection('users').doc(userId).delete();
    logger.log(`Deleted user document for ${userId}`);
  } catch (error) {
    logger.error('Error deleting user document:', error);
    throw error;
  }
}

async function deleteAuthUser(userId: string): Promise<void> {
  try {
    await auth.deleteUser(userId);
    logger.log(`Deleted Firebase Auth user ${userId}`);
  } catch (error) {
    logger.error('Error deleting Firebase Auth user:', error);
    throw error;
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<DeleteAccountResponse>> {
  try {
    const userResult = await verifyUserFromToken(request);

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;
    logger.log(`User ${userId} requesting account deletion`);

    const deletionResults = {
      conversations: 0,
      purchases: 0,
      creditDeductions: 0,
    };

    try {
      deletionResults.conversations = await deleteUserDocumentsFromCollection(
        'conversations',
        userId
      );

      deletionResults.purchases = await deleteUserDocumentsFromCollection(
        'purchases',
        userId
      );

      deletionResults.creditDeductions =
        await deleteUserDocumentsFromCollection('creditDeductions', userId);

      await deleteUserDocument(userId);

      logger.log(`Firestore data deleted for user ${userId}:`, deletionResults);
    } catch (error) {
      logger.error('Error deleting Firestore data:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'deletion-failed',
          message: 'Failed to delete user data',
        },
        { status: 500 }
      );
    }

    try {
      await deleteAuthUser(userId);
    } catch (error: any) {
      logger.error('Error deleting Firebase Auth user:', error);

      if (error.code !== 'auth/user-not-found') {
        return NextResponse.json(
          {
            success: false,
            error: 'auth-deletion-failed',
            message: 'Failed to delete authentication account',
          },
          { status: 500 }
        );
      }
    }

    try {
      await clearAllSessionValues();
      logger.log(`Session data cleared for user ${userId}`);
    } catch (error) {
      logger.warn('Error clearing session data:', error);
    }

    logger.info(`Account deleted successfully for user ${userId}`, {
      userId,
      deletedDocuments: deletionResults,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error in account/delete:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'internal-error',
        message: 'An internal error occurred',
      },
      { status: 500 }
    );
  }
}
