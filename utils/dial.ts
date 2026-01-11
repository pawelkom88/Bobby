export type DialButtonLabelKey =
  | 'buttons.call'
  | 'buttons.loading'
  | 'buttons.buyAndCall';

interface GetDialButtonLabelKeyArgs {
  hasCredits: boolean;
  isBusy: boolean;
}

export function getDialButtonLabelKey({
  hasCredits,
  isBusy,
}: GetDialButtonLabelKeyArgs): DialButtonLabelKey {
  if (isBusy) return 'buttons.loading';
  return hasCredits ? 'buttons.call' : 'buttons.buyAndCall';
}

export function getStableUserId(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null;

  const candidate = user as {
    id?: string;
    uid?: string;
    userId?: string;
    sub?: string;
    email?: string;
  };

  return (
    candidate.id ??
    candidate.uid ??
    candidate.userId ??
    candidate.sub ??
    candidate.email ??
    null
  );
}
