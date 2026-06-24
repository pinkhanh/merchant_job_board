export const PAGE_SIZE = 10;

/**
 * Parses a raw `page` query-string value into a safe positive integer.
 * Defaults to 1 for null, non-numeric, non-finite, zero, negative, or fractional input.
 */
export function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
