import { describe, expect, it } from 'vitest';
import { isSupportedBarcode, normalizeBarcode } from './barcode';

describe('normalizeBarcode', () => {
  it('normalizes UPC-A to a 13-digit lookup key', () => {
    expect(normalizeBarcode('036000291452')).toBe('0036000291452');
  });

  it('preserves a valid EAN-13', () => {
    expect(normalizeBarcode('4006381333931')).toBe('4006381333931');
  });

  it('strips spaces and punctuation from common barcode input', () => {
    expect(normalizeBarcode('4006 3813-33931')).toBe('4006381333931');
  });

  it('accepts a valid 8-digit barcode', () => {
    expect(normalizeBarcode('73513537')).toBe('73513537');
  });

  it('rejects unsupported lengths', () => {
    expect(normalizeBarcode('1234567')).toBeNull();
    expect(normalizeBarcode('123456789')).toBeNull();
  });

  it('rejects an invalid checksum', () => {
    expect(normalizeBarcode('4006381333932')).toBeNull();
  });
});

describe('isSupportedBarcode', () => {
  it('returns true for common EAN and UPC values', () => {
    expect(isSupportedBarcode('4006381333931')).toBe(true);
    expect(isSupportedBarcode('036000291452')).toBe(true);
    expect(isSupportedBarcode('73513537')).toBe(true);
  });

  it('returns false for invalid values', () => {
    expect(isSupportedBarcode('abc')).toBe(false);
    expect(isSupportedBarcode('4006381333932')).toBe(false);
  });
});
