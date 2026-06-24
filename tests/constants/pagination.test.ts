import { describe, it, expect } from 'vitest';
import { parsePage } from '@/lib/constants/pagination';

describe('parsePage', () => {
  it('parses a valid page number', () => {
    expect(parsePage('2')).toBe(2);
  });

  it('defaults to 1 when the value is missing/null', () => {
    expect(parsePage(null)).toBe(1);
  });

  it('defaults to 1 for a non-numeric string', () => {
    expect(parsePage('abc')).toBe(1);
  });

  it('defaults to 1 for zero', () => {
    expect(parsePage('0')).toBe(1);
  });

  it('defaults to 1 for a negative number', () => {
    expect(parsePage('-3')).toBe(1);
  });

  it('defaults to 1 for a fractional number', () => {
    expect(parsePage('1.5')).toBe(1);
  });
});
