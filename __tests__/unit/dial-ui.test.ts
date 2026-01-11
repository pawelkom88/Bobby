import { describe, it, expect } from 'vitest';
import { getDialButtonLabelKey } from '../../lib/dial-ui';

describe('getDialButtonLabelKey', () => {
  it('returns loading when busy regardless of credits', () => {
    expect(getDialButtonLabelKey({ hasCredits: true, isBusy: true })).toBe(
      'buttons.loading'
    );
    expect(getDialButtonLabelKey({ hasCredits: false, isBusy: true })).toBe(
      'buttons.loading'
    );
  });

  it('returns call when user has credits and is not busy', () => {
    expect(getDialButtonLabelKey({ hasCredits: true, isBusy: false })).toBe(
      'buttons.call'
    );
  });

  it('returns buyAndCall when user lacks credits and is not busy', () => {
    expect(getDialButtonLabelKey({ hasCredits: false, isBusy: false })).toBe(
      'buttons.buyAndCall'
    );
  });
});
