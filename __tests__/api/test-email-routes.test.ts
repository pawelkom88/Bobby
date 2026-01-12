import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as testWelcome } from '@/app/api/test-email/route';
import { GET as testReset } from '@/app/api/test-reset-email/route';
import { GET as testGoodbye } from '@/app/api/test-goodbye-email/route';
import { readJson } from './route-test-helpers';
import * as mailer from '@/lib/mailer';

vi.mock('@/lib/mailer', () => ({
  sendWelcomeEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendGoodbyeEmail: vi.fn(),
}));

const shouldRunEmailRouteTests =
  process.env.RUN_TEST_EMAIL_ROUTES === 'true' && !process.env.CI;
const describeEmailRoutes = shouldRunEmailRouteTests ? describe : describe.skip;

describeEmailRoutes('Test email API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends welcome email test', async () => {
    const response = await testWelcome();
    const body = await readJson<{ success?: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mailer.sendWelcomeEmail).toHaveBeenCalled();
  });

  it('sends reset email test', async () => {
    const response = await testReset();
    const body = await readJson<{ success?: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('sends goodbye email test', async () => {
    const response = await testGoodbye();
    const body = await readJson<{ success?: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mailer.sendGoodbyeEmail).toHaveBeenCalled();
  });
});
