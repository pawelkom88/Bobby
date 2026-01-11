import { ApiError } from '@/lib/api/errors';
import {
  StartConversationResponseSchema,
  EndConversationResponseSchema,
  DeductCreditsResponseSchema,
  type StartConversationRequest,
  type StartConversationResponse,
  type EndConversationRequest,
  type EndConversationResponse,
  type DeductCreditsResponse,
} from '@/schemas/conversation.schema';

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
};

export async function startConversation(
  request: StartConversationRequest,
  authToken: string
): Promise<StartConversationResponse> {
  const response = await fetch('/api/conversation/start', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, 'Failed to start conversation'),
      response.status,
      data
    );
  }

  return StartConversationResponseSchema.parse(data);
}

export async function endConversation(
  request: EndConversationRequest,
  authToken: string
): Promise<EndConversationResponse> {
  const response = await fetch('/api/conversation/end', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, 'Failed to end conversation'),
      response.status,
      data
    );
  }

  return EndConversationResponseSchema.parse(data);
}

export async function deductCredits(
  conversationId: string,
  authToken: string
): Promise<DeductCreditsResponse> {
  const response = await fetch('/api/deduct-credits', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ conversationId }),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, 'Failed to deduct credits'),
      response.status,
      data
    );
  }

  return DeductCreditsResponseSchema.parse(data);
}
