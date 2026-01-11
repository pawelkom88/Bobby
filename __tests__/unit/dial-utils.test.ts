import { describe, it, expect } from 'vitest';
import { getDialButtonLabelKey, getStableUserId } from '../../utils/dial';

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

describe('getStableUserId', () => {
  it('returns null for non-objects', () => {
    expect(getStableUserId(null)).toBeNull();
    expect(getStableUserId(undefined)).toBeNull();
    expect(getStableUserId('user')).toBeNull();
  });

  it('returns the first matching id field', () => {
    expect(getStableUserId({ id: 'a', uid: 'b' })).toBe('a');
    expect(getStableUserId({ uid: 'b', userId: 'c' })).toBe('b');
    expect(getStableUserId({ userId: 'c', sub: 'd' })).toBe('c');
    expect(getStableUserId({ sub: 'd', email: 'e' })).toBe('d');
    expect(getStableUserId({ email: 'e' })).toBe('e');
  });
});
