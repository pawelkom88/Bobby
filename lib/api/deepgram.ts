import { fetchWithValidation } from '@/lib/fetcher';
import {
  DeepgramTokenResponseSchema,
  type DeepgramTokenResponse,
} from '@/schemas/authenticate.schema';

export async function fetchDeepgramToken(
  authToken: string
): Promise<DeepgramTokenResponse> {
  return fetchWithValidation('/api/authenticate', DeepgramTokenResponseSchema, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
}
