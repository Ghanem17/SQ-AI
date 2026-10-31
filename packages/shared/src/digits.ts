// Many Arabic keyboards type Arabic-Indic digits (٠١٢…) or Persian ones (۰۱۲…).
// Inputs accept all three forms and store Western digits.

const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

export function toWesternDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9) {
      out += String(code - ARABIC_INDIC_ZERO);
    } else if (code >= PERSIAN_ZERO && code <= PERSIAN_ZERO + 9) {
      out += String(code - PERSIAN_ZERO);
    } else {
      out += ch;
    }
  }
  return out;
}

export function onlyDigits(input: string): string {
  return toWesternDigits(input).replace(/\D/g, '');
}
