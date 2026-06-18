import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatTuple,
  summarizeTypedArray,
} from '../../src/utils/format';

describe('format utilities', () => {
  it('formats bytes using binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });

  it('formats duration in seconds', () => {
    expect(formatDuration(0)).toBe('0.000s');
    expect(formatDuration(1.23456)).toBe('1.235s');
  });

  it('formats finite and non-finite numbers', () => {
    expect(formatNumber(1.23456)).toBe('1.235');
    expect(formatNumber(Number.NaN)).toBe('NaN');
  });

  it('formats tuples', () => {
    expect(formatTuple([1, 2.3456, -3])).toBe('[1, 2.346, -3]');
  });

  it('summarizes typed arrays', () => {
    expect(summarizeTypedArray(new Float32Array([1, 2, 3, 4, 5]))).toBe(
      'Float32Array length=5 sample=[1, 2, 3, 4]',
    );
  });
});
