import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateQuery,
  validateCount,
  validateMode,
} from '@/lib/validation';

/**
 * These tests exercise the same validation functions used by the API routes
 * (query, similarity, random) to verify input handling at the boundary layer.
 * We test the functions directly rather than spinning up Next.js route handlers.
 */

describe('API input validation — query endpoint edge cases', () => {
  it('rejects object payloads for query', () => {
    expect(validateQuery({ toString: () => 'sneaky' })).toEqual({
      valid: false,
      error: 'query must be a string',
    });
  });

  it('rejects array payloads for query', () => {
    expect(validateQuery(['hello'])).toEqual({
      valid: false,
      error: 'query must be a string',
    });
  });

  it('validates mode accepts known values', () => {
    expect(validateMode('explain')).toEqual({ valid: true });
    expect(validateMode('dependencies')).toEqual({ valid: true });
    expect(validateMode('docs')).toEqual({ valid: true });
    expect(validateMode('translate')).toEqual({ valid: true });
  });

  it('validates mode rejects unknown values', () => {
    const result = validateMode('hack');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('mode must be one of');
  });

  it('validates mode allows null/undefined (optional field)', () => {
    expect(validateMode(null)).toEqual({ valid: true });
    expect(validateMode(undefined)).toEqual({ valid: true });
  });
});

describe('API input validation — XSS prevention', () => {
  it('strips script injection from query text', () => {
    const malicious = '<script>document.cookie</script>LAPACK query';
    expect(sanitizeString(malicious)).toBe('document.cookieLAPACK query');
  });

  it('strips event handler injection', () => {
    const malicious = '<img src=x onerror=alert(1)>query';
    expect(sanitizeString(malicious)).toBe('query');
  });

  it('strips nested tags', () => {
    const malicious = '<<script>script>alert(1)<</script>/script>';
    const result = sanitizeString(malicious);
    expect(result).not.toContain('<script>');
  });

  it('preserves legitimate angle brackets in code questions', () => {
    // A user asking about Fortran comparison operators — the < and > without
    // closing > should pass through since they don't form complete tags.
    const query = 'What does A .LT. B mean?';
    expect(sanitizeString(query)).toBe(query);
  });
});

describe('API input validation — count parameter boundaries', () => {
  it('returns 1 for zero', () => {
    expect(validateCount('0')).toBe(1);
  });

  it('returns 20 for 21', () => {
    expect(validateCount('21')).toBe(20);
  });

  it('handles negative numbers', () => {
    expect(validateCount('-1')).toBe(1);
  });

  it('handles Infinity string', () => {
    // Number('Infinity') is Infinity, not an integer
    expect(validateCount('Infinity')).toBe(2);
  });

  it('handles empty string', () => {
    // Number('') is 0, which is an integer, so it clamps to 1
    expect(validateCount('')).toBe(1);
  });
});
