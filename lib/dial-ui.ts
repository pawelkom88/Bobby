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
