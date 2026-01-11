import { fetchWithValidation } from '@/lib/fetcher';
import { CheckoutSessionResponseSchema } from '@/schemas/checkout.schema';
import type { PackType } from '@/config/packages';
import type { CheckoutSessionResponse } from '@/schemas/checkout.schema';

export interface CheckoutSessionParams {
  locale: string;
  packType: PackType;
}

export async function createCheckoutSession(
  params: CheckoutSessionParams,
  authToken: string
): Promise<CheckoutSessionResponse> {
  const { locale, packType } = params;
  const url = `/api/checkout_sessions?locale=${encodeURIComponent(
    locale
  )}&packType=${packType}`;

  return fetchWithValidation(url, CheckoutSessionResponseSchema, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
}
