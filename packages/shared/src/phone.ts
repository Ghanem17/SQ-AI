import { onlyDigits } from './digits.ts';

export type Country = {
  code: string;
  dial: string;
  nameAr: string;
  nameEn: string;
  // National number length and allowed first digits, without the trunk 0.
  length: number;
  startsWith: string[];
  // Digit groups for display, e.g. [3, 3, 4] -> 770 123 4567.
  groups: number[];
};

export const countries: Country[] = [
  { code: 'IQ', dial: '964', nameAr: 'العراق', nameEn: 'Iraq', length: 10, startsWith: ['7'], groups: [3, 3, 4] },
  { code: 'SA', dial: '966', nameAr: 'السعودية', nameEn: 'Saudi Arabia', length: 9, startsWith: ['5'], groups: [2, 3, 4] },
  { code: 'AE', dial: '971', nameAr: 'الإمارات', nameEn: 'UAE', length: 9, startsWith: ['5'], groups: [2, 3, 4] },
  { code: 'KW', dial: '965', nameAr: 'الكويت', nameEn: 'Kuwait', length: 8, startsWith: ['5', '6', '9'], groups: [4, 4] },
  { code: 'JO', dial: '962', nameAr: 'الأردن', nameEn: 'Jordan', length: 9, startsWith: ['7'], groups: [1, 4, 4] },
  { code: 'SY', dial: '963', nameAr: 'سوريا', nameEn: 'Syria', length: 9, startsWith: ['9'], groups: [3, 3, 3] },
  { code: 'EG', dial: '20', nameAr: 'مصر', nameEn: 'Egypt', length: 10, startsWith: ['1'], groups: [3, 3, 4] },
  { code: 'TR', dial: '90', nameAr: 'تركيا', nameEn: 'Türkiye', length: 10, startsWith: ['5'], groups: [3, 3, 4] },
];

export const defaultCountry = countries[0];

export function findCountry(code: string): Country {
  return countries.find((c) => c.code === code) ?? defaultCountry;
}

// Turns whatever the person typed (with +, 00, the country code, a leading 0,
// spaces or Arabic digits) into the national number.
export function nationalNumber(input: string, country: Country): string {
  let digits = onlyDigits(input);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith(country.dial) && digits.length > country.length) {
    digits = digits.slice(country.dial.length);
  }
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export type PhoneCheck =
  | { ok: true; national: string; e164: string }
  | { ok: false; reason: 'empty' | 'short' | 'long' | 'prefix'; national: string };

export function checkPhone(input: string, country: Country): PhoneCheck {
  const national = nationalNumber(input, country);
  if (national.length === 0) return { ok: false, reason: 'empty', national };
  if (!country.startsWith.some((p) => national.startsWith(p))) {
    return { ok: false, reason: 'prefix', national };
  }
  if (national.length < country.length) return { ok: false, reason: 'short', national };
  if (national.length > country.length) return { ok: false, reason: 'long', national };
  return { ok: true, national, e164: `+${country.dial}${national}` };
}

export function formatNational(national: string, country: Country): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of country.groups) {
    if (i >= national.length) break;
    parts.push(national.slice(i, i + size));
    i += size;
  }
  if (i < national.length) parts.push(national.slice(i));
  return parts.join(' ');
}

// "+9647701234567" → "+964 770 123 4567", for showing a saved number.
// Unknown numbers come back unchanged.
export function formatE164(e164: string): string {
  const digits = onlyDigits(e164);
  const country = [...countries].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial) && digits.length === c.dial.length + c.length);
  if (!country) return e164;
  return `+${country.dial} ${formatNational(digits.slice(country.dial.length), country)}`;
}
