import { authenticatedFetch } from '@/lib/fetcher';
import {
  SessionGetResponseSchema,
  SessionSetResponseSchema,
  type AssessmentData,
  type SessionData,
  type SetAssessmentRequest,
  type SetConversationCompleteRequest,
  type SetConversationIdRequest,
} from '@/schemas/session.schema';

export async function fetchSession(
  getAuthToken: () => Promise<string | null>
): Promise<SessionData> {
  const response = await authenticatedFetch(
    '/api/session/get',
    SessionGetResponseSchema,
    getAuthToken
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch session data');
  }

  return response.data;
}

export async function setAssessment(
  data: { assessment: AssessmentData; completionId: string },
  getAuthToken: () => Promise<string | null>
) {
  const request: SetAssessmentRequest = {
    assessment: data.assessment,
    completionId: data.completionId,
  };

  const response = await authenticatedFetch(
    '/api/session/assessment',
    SessionSetResponseSchema,
    getAuthToken,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to store assessment');
  }

  return response;
}

export async function setConversationId(
  conversationId: string,
  getAuthToken: () => Promise<string | null>
) {
  const request: SetConversationIdRequest = {
    conversationId,
  };

  const response = await authenticatedFetch(
    '/api/session/conversation-id',
    SessionSetResponseSchema,
    getAuthToken,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to set conversation ID');
  }

  return response;
}

export async function setConversationComplete(
  complete: boolean,
  getAuthToken: () => Promise<string | null>
) {
  const request: SetConversationCompleteRequest = {
    complete,
  };

  const response = await authenticatedFetch(
    '/api/session/complete',
    SessionSetResponseSchema,
    getAuthToken,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to update conversation status');
  }

  return response;
}

export async function clearSession(
  getAuthToken: () => Promise<string | null>
) {
  const response = await authenticatedFetch(
    '/api/session/clear',
    SessionSetResponseSchema,
    getAuthToken,
    {
      method: 'POST',
    }
  );

  if (!response.success) {
    throw new Error(response.error || 'Failed to clear session');
  }

  return response;
}
