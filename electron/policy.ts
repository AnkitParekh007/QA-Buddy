export function validateHttpsUrl(input: string): string {
  const u = new URL(input);
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || u.port && u.port !== '443') throw new Error('Only standard HTTPS URLs without embedded credentials are allowed');
  if (u.hostname === 'localhost' || u.hostname.endsWith('.localhost') || !u.hostname.includes('.')) throw new Error('Use an approved public DNS hostname; private/localhost endpoints require separate allowlisting');
  return u.origin;
}
export function validateStoryKey(value: string): string {
  if (!/^[A-Z][A-Z0-9_]{1,19}-[1-9][0-9]{0,9}$/.test(value)) throw new Error('Invalid Jira issue key');
  return value;
}
export function requireNonProduction(production: boolean): void {
  if (production) throw new Error('Production mutation is blocked');
}
