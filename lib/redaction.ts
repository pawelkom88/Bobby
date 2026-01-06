import type { ConversationMessage } from '@/types';

const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const UK_POSTCODE_REGEX =
  /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi;
const PL_POSTCODE_REGEX = /\b\d{2}-\d{3}\b/g;
const POSTCODE_LABEL_REGEX =
  /\b(postcode|post code|zip|zip code|postal code|kod pocztowy)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\s-]{2,9})\b/gi;
const PHONE_CANDIDATE_REGEX = /(?:\+?\d[\d().\s-]{6,}\d)/g;

function redactPhoneNumbers(text: string): string {
  return text.replace(PHONE_CANDIDATE_REGEX, match => {
    if (/[A-Za-z]/.test(match)) {
      return match;
    }
    const digits = match.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return match;
    }
    return '[REDACTED]';
  });
}

export function redactText(text: string): string {
  let redacted = text;
  redacted = redacted.replace(EMAIL_REGEX, '[REDACTED]');
  redacted = redacted.replace(POSTCODE_LABEL_REGEX, '$1 [REDACTED]');
  redacted = redacted.replace(UK_POSTCODE_REGEX, '[REDACTED]');
  redacted = redacted.replace(PL_POSTCODE_REGEX, '[REDACTED]');
  redacted = redactPhoneNumbers(redacted);
  return redacted;
}

export function redactConversation(
  conversation: ConversationMessage[]
): ConversationMessage[] {
  return conversation.map(message => ({
    ...message,
    text: redactText(message.text),
  }));
}
