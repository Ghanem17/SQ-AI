// Phase 1 stand-in for the auth API. It has the same shape the server will
// expose in phase 2 (send a WhatsApp code, verify it), so the screens do not
// change when the real calls replace these.

export const DEMO_CODE = '123456';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendCode(_e164: string): Promise<void> {
  await wait(700);
}

export type VerifyResult = 'ok' | 'wrong';

export async function verifyCode(_e164: string, code: string): Promise<VerifyResult> {
  await wait(600);
  return code === DEMO_CODE ? 'ok' : 'wrong';
}
