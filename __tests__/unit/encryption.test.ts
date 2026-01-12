import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('encryption helpers', () => {
  const originalKey = process.env.SESSION_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SESSION_ENCRYPTION_KEY = 'unit-test-key';
  });

  afterEach(() => {
    process.env.SESSION_ENCRYPTION_KEY = originalKey;
  });

  const loadEncryption = async () => {
    vi.resetModules();
    return await import('@/lib/encryption');
  };

  it('round-trips encrypted payloads', async () => {
    const { encrypt, decrypt } = await loadEncryption();
    const payload = 'secret-message';
    const encrypted = await encrypt(payload);
    const decrypted = await decrypt(encrypted);

    expect(decrypted).toBe(payload);
  });

  it('fails to decrypt invalid payloads', async () => {
    const { decrypt } = await loadEncryption();
    await expect(decrypt('invalid')).rejects.toThrow('Failed to decrypt data');
  });

  it('throws when encryption key is missing', async () => {
    delete process.env.SESSION_ENCRYPTION_KEY;

    const { encrypt } = await loadEncryption();
    await expect(encrypt('data')).rejects.toThrow('Failed to encrypt data');
  });
});
