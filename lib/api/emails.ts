import { fetchWithValidation } from '@/lib/fetcher';
import {
  WelcomeEmailResponseSchema,
  type WelcomeEmailResponse,
} from '@/schemas/welcome-email.schema';

export async function sendWelcomeEmail(
  authToken: string,
  name?: string
): Promise<WelcomeEmailResponse> {
  return fetchWithValidation(
    '/api/send-welcome-email',
    WelcomeEmailResponseSchema,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ name }),
    }
  );
}
