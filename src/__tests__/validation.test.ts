import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateQuery,
  validateRoutineId,
  validateCount,
} from '@/lib/validation';

describe('sanitizeString', () => {
  it('strips <script> tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>hello')).toBe(
      'alert("xss")hello'
    );
  });

  it('strips <b> tags', () => {
    expect(sanitizeString('<b>bold</b>')).toBe('bold');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('strips nested/malformed tags', () => {
    expect(sanitizeString('<div><img src=x onerror=alert(1)>text</div>')).toBe(
      'text'
    );
  });
});

describe('validateQuery', () => {
  it('rejects non-string values', () => {
    expect(validateQuery(42)).toEqual({
      valid: false,
      error: 'query must be a string',
    });
    expect(validateQuery(null)).toEqual({
      valid: false,
      error: 'query must be a string',
    });
    expect(validateQuery(undefined)).toEqual({
      valid: false,
      error: 'query must be a string',
    });
  });

  it('rejects empty string', () => {
    expect(validateQuery('')).toEqual({
      valid: false,
      error: 'query must not be empty',
    });
    expect(validateQuery('   ')).toEqual({
      valid: false,
      error: 'query must not be empty',
    });
  });

  it('rejects overlength query (>1000 chars)', () => {
    const long = 'a'.repeat(1001);
    const result = validateQuery(long);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('1000');
  });

  it('accepts valid query', () => {
    expect(validateQuery('What does DGEMM do?')).toEqual({ valid: true });
  });

  it('accepts query at exactly 1000 chars', () => {
    expect(validateQuery('a'.repeat(1000))).toEqual({ valid: true });
  });
});

describe('validateRoutineId', () => {
  it('rejects empty string', () => {
    expect(validateRoutineId('')).toEqual({
      valid: false,
      error: 'routine ID must be a non-empty string',
    });
  });

  it('rejects non-string values', () => {
    expect(validateRoutineId(123)).toEqual({
      valid: false,
      error: 'routine ID must be a non-empty string',
    });
    expect(validateRoutineId(null)).toEqual({
      valid: false,
      error: 'routine ID must be a non-empty string',
    });
  });

  it('accepts valid ID', () => {
    expect(validateRoutineId('dgemm')).toEqual({ valid: true });
  });
});

describe('validateCount', () => {
  it('returns default for null', () => {
    expect(validateCount(null)).toBe(2);
  });

  it('returns custom default for null', () => {
    expect(validateCount(null, 5)).toBe(5);
  });

  it('clamps to minimum of 1', () => {
    expect(validateCount('0')).toBe(1);
    expect(validateCount('-5')).toBe(1);
  });

  it('clamps to maximum of 20', () => {
    expect(validateCount('50')).toBe(20);
    expect(validateCount('999')).toBe(20);
  });

  it('returns default for NaN', () => {
    expect(validateCount('abc')).toBe(2);
  });

  it('returns default for float strings', () => {
    expect(validateCount('3.7')).toBe(2);
  });

  it('accepts valid integer string', () => {
    expect(validateCount('10')).toBe(10);
  });
});
