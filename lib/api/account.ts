import { ApiError } from '@/lib/api/errors';
import {
  DeleteAccountResponseSchema,
  type DeleteAccountResponse,
} from '@/schemas/account.schema';

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function deleteAccount(
  authToken: string
): Promise<DeleteAccountResponse> {
  const response = await fetch('/api/account/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  });

  const json = await parseJson(response);

  if (!response.ok) {
    const parsed = DeleteAccountResponseSchema.safeParse(json);
    const message =
      parsed.success && parsed.data.message
        ? parsed.data.message
        : 'Failed to delete account';
    throw new ApiError(message, response.status, parsed.success ? parsed.data : json);
  }

  return DeleteAccountResponseSchema.parse(json);
}
