import { fetchWithValidation } from '@/lib/fetcher';
import {
  ResetPasswordRequestSchema,
  ResetPasswordResponseSchema,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
} from '@/schemas/auth.schema';

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const validated = ResetPasswordRequestSchema.parse(request);
  return fetchWithValidation(
    '/api/auth/reset-password',
    ResetPasswordResponseSchema,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated),
    }
  );
}
