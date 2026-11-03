// Holds the tester's access code for the AI client. Set from the saved
// session; kept apart so the session and the client don't import each other.
let code = '';

export function setAccessCode(next: string) {
  code = next;
}

export function accessHeaders(): Record<string, string> {
  return code ? { 'x-sq-access': code } : {};
}
