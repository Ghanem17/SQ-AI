import { onlyDigits, toWesternDigits } from './digits.ts';

export const OTP_LENGTH = 6;

const STANDALONE_CODE = new RegExp(`(?<!\\d)\\d{${OTP_LENGTH}}(?!\\d)`);

// Keeps what can be part of a code: Western digits only, at most OTP_LENGTH.
// Pasting a whole SMS or WhatsApp message still yields the code, even when
// the message has other numbers ("valid for 10 minutes").
export function sanitizeOtp(input: string): string {
  const standalone = toWesternDigits(input).match(STANDALONE_CODE);
  if (standalone) return standalone[0];
  return onlyDigits(input).slice(0, OTP_LENGTH);
}

export function isCompleteOtp(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);
}
