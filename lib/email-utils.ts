const MAX_EMAIL_LENGTH = 254;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === 'string' &&
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    EMAIL_REGEX.test(email)
  );
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';

  const maskedLocal =
    local.length > 2
      ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${
          local[local.length - 1]
        }`
      : '**';

  const domainParts = domain.split('.');
  const maskedDomain =
    domainParts.length > 1
      ? `${domainParts[0][0]}***${
          domainParts[0][domainParts[0].length - 1]
        }.${domainParts.slice(1).join('.')}`
      : '***';

  return `${maskedLocal}@${maskedDomain}`;
}

export async function hashForRateLimit(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .slice(0, 12)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const emailUtils = {
  isValidEmail,
  maskEmail,
  hashForRateLimit,
};

export type EmailUtils = typeof emailUtils;
