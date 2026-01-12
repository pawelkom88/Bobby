import { describe, it, expect } from 'vitest';
import { redactText, redactConversation } from '@/lib/redaction';

describe('redaction helpers', () => {
  it('redacts emails, postcodes, and phone numbers', () => {
    const input =
      'Email me at test@example.com. Postcode SW1A 1AA. Call +44 7700 900123.';
    const output = redactText(input);

    expect(output).not.toContain('test@example.com');
    expect(output).not.toContain('SW1A 1AA');
    expect(output).toContain('[REDACTED]');
  });

  it('keeps alphanumeric phone-like strings intact', () => {
    const input = 'Code ABC-123-XYZ should stay.';
    const output = redactText(input);

    expect(output).toContain('ABC-123-XYZ');
  });

  it('redacts conversation message text', () => {
    const conversation = [
      { id: '1', role: 'user', text: 'Send to test@example.com' },
    ];
    const redacted = redactConversation(conversation as any);

    expect(redacted[0].text).toBe('Send to [REDACTED]');
  });
});
