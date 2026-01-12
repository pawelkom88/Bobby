import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { verifyBearerUser, enforceBearerRateLimit } from '@/lib/bearer-auth';
import { clearAllSessionValues } from '@/lib/session-storage';
import { logger } from '@/lib/logger';
import { rateLimiters, createRateLimitHeaders } from '@/lib/rateLimit';
import { sendGoodbyeEmail } from '@/lib/mailer';

const BATCH_SIZE = 500;

interface DeleteAccountResponse {
  success: boolean;
  error?: string;
  message?: string;
  retryAfter?: number;
}

async function deleteUserDocumentsFromCollection(
  collectionName: string,
  userId: string,
  db: ReturnType<typeof getAdminDb>
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

async function deleteUserDocument(
  userId: string,
  db: ReturnType<typeof getAdminDb>
): Promise<void> {
  try {
    await db.collection('users').doc(userId).delete();
    logger.log(`Deleted user document for ${userId}`);
  } catch (error) {
    logger.error('Error deleting user document:', error);
    throw error;
  }
}

async function deleteAuthUser(
  userId: string,
  auth: ReturnType<typeof getAdminAuth>
): Promise<void> {
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
    // Lazy initialization - only initialize when handler is called
    const auth = getAdminAuth();
    const db = getAdminDb();

    const userResult = await verifyBearerUser(request, auth, 'account/delete');

    if ('error' in userResult) {
      return NextResponse.json(
        { success: false, error: 'unauthorized', message: userResult.error },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    // Rate limiting - strict limit for destructive operation
    const rateLimitResponse = await enforceBearerRateLimit(
      request,
      userId,
      rateLimiters.strict,
      'account-delete',
      rateLimit => {
        logger.warn('Rate limit exceeded for account/delete endpoint', {
          userId,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        });

        return NextResponse.json(
          {
            success: false,
            error: 'rate-limited',
            message: 'Too many requests',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: createRateLimitHeaders(rateLimit),
          }
        );
      }
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    logger.log(`User ${userId} requesting account deletion`);

    // Get user email before deletion for goodbye email
    let userEmail: string | undefined;
    let userName: string | undefined;
    try {
      const userRecord = await auth.getUser(userId);
      userEmail = userRecord.email;
      userName = userRecord.displayName || 'there';
    } catch (error) {
      logger.warn('Could not fetch user record for goodbye email', { userId });
    }

    const deletionResults = {
      conversations: 0,
      purchases: 0,
      creditDeductions: 0,
    };

    try {
      deletionResults.conversations = await deleteUserDocumentsFromCollection(
        'conversations',
        userId,
        db
      );

      deletionResults.purchases = await deleteUserDocumentsFromCollection(
        'purchases',
        userId,
        db
      );

      deletionResults.creditDeductions =
        await deleteUserDocumentsFromCollection('creditDeductions', userId, db);

      await deleteUserDocument(userId, db);

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
      await deleteAuthUser(userId, auth);
    } catch (error: unknown) {
      logger.error('Error deleting Firebase Auth user:', error);

      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : undefined;

      if (errorCode !== 'auth/user-not-found') {
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

    // Send goodbye email (don't block deletion if email fails)
    if (userEmail) {
      try {
        await sendGoodbyeEmail(userEmail, userName || 'there');
        logger.info('Goodbye email sent successfully', { userId });
      } catch (emailError) {
        logger.error('Failed to send goodbye email', {
          userId,
          error: emailError,
        });
      }
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
  } catch (error: unknown) {
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
