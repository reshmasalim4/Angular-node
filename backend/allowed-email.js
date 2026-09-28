/**
 * True when the email belongs to the allowed domain, e.g. "gmail.com".
 * Compared case-insensitively against the part after the last "@".
 */
export function isAllowedEmail(email, allowedDomain) {
  if (typeof email !== 'string' || !allowedDomain) return false;
  const at = email.lastIndexOf('@');
  if (at <= 0) return false;
  return email.slice(at + 1).toLowerCase() === allowedDomain.toLowerCase();
}
