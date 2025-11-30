/**
 * POST /api/conversation/start
 * Creates a conversation record with server-side timestamp
 * 
 * Security:
 * - Requires valid Firebase ID token
 * - Server-side timestamp (client cannot manipulate)
 * - Creates conversation record for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { verifyToken } from '@/lib/token-verifier';
import { logger } from '@/lib/logger';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

interface StartConversationRequest {
  ageTier: 1 | 2 | 3;
  service: 'fire' | 'ambulance' | 'police';
}

interface StartConversationResponse {
  conversationId: string;
  startedAt: string;
  status: string;
  error?: string;
  message?: string;
}

/**
 * Validates request body
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  const validAgeTiers = [1, 2, 3];
  if (!validAgeTiers.includes(body.ageTier)) {
    return { valid: false, error: 'Invalid ageTier' };
  }

  const validServices = ['fire', 'ambulance', 'police'];
  if (!validServices.includes(body.service)) {
    return { valid: false, error: 'Invalid service' };
  }

  return { valid: true };
}

/**
 * Extracts and verifies user from token
 */
async function verifyUserFromToken(
  authHeader: string | null
): Promise<{ userId: string } | { error: string; status: number }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid Authorization header');
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const result = await verifyToken(
      (token) => auth.verifyIdToken(token),
      token
    );

    if (!result.success || !result.uid) {
      logger.warn('Token verification failed');
      return { error: 'Invalid token', status: 401 };
    }

    return { userId: result.uid };
  } catch (error: any) {
    logger.warn('Token verification error:', error.code);
    return { error: 'Invalid token', status: 401 };
  }
}

/**
 * Main handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<StartConversationResponse>> {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      logger.warn('Invalid request:', validation.error);
      return NextResponse.json(
        { 
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'invalid-request',
          message: validation.error 
        },
        { status: 400 }
      );
    }

    const { ageTier, service } = body as StartConversationRequest;

    // 2. Verify user from token
    const authHeader = request.headers.get('Authorization');
    const userResult = await verifyUserFromToken(authHeader);

    if ('error' in userResult) {
      return NextResponse.json(
        { 
          conversationId: '',
          startedAt: '',
          status: 'error',
          error: 'unauthorized',
          message: userResult.error 
        },
        { status: userResult.status }
      );
    }

    const userId = userResult.userId;

    // 3. Create conversation record with server timestamp
    const conversationRef = db.collection('conversations').doc();
    const now = new Date().toISOString();

    await conversationRef.set({
      id: conversationRef.id,
      userId,
      ageTier,
      service,
      startedAt: now,
      status: 'active',
      charged: false,
    });

    logger.log(`Created conversation ${conversationRef.id} for user ${userId}`);

    return NextResponse.json(
      {
        conversationId: conversationRef.id,
        startedAt: now,
        status: 'active',
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error in conversation/start:', error);

    return NextResponse.json(
      { 
        conversationId: '',
        startedAt: '',
        status: 'error',
        error: 'internal-error',
        message: 'An internal error occurred' 
      },
      { status: 500 }
    );
  }
}
