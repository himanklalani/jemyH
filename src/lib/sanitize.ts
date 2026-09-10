/**
 * Utility to escape regular expression special characters to prevent
 * Regular Expression Denial of Service (ReDoS) and injection attacks.
 */
export function escapeRegex(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns a safe RegExp instance with special characters escaped.
 */
export function createSafeRegex(input: string, flags: string = 'i'): RegExp {
  return new RegExp(escapeRegex(input), flags);
}
