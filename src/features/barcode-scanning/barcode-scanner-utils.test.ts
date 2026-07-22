import { describe, expect, it, vi } from 'vitest';
import { getBarcodeScannerErrorMessage, isDuplicateBarcode } from './barcode-scanner-utils';

describe('getBarcodeScannerErrorMessage', () => {
  it('reports insecure contexts', () => {
    vi.stubGlobal('isSecureContext', false);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } });
    expect(getBarcodeScannerErrorMessage(new Error('x'))).toBe('Camera scanning requires a secure HTTPS context.');
  });

  it('reports unsupported browsers', () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {});
    expect(getBarcodeScannerErrorMessage(new Error('x'))).toBe('This browser does not support camera scanning.');
  });

  it('maps permission denied errors', () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } });
    expect(getBarcodeScannerErrorMessage(new DOMException('denied', 'NotAllowedError'))).toContain('Camera access was denied');
  });
});

describe('isDuplicateBarcode', () => {
  it('debounces duplicate detections within the threshold', () => {
    expect(isDuplicateBarcode('0036000291452', '0036000291452', 1000, 1500)).toBe(true);
  });

  it('allows different or older detections', () => {
    expect(isDuplicateBarcode('0036000291452', '4006381333931', 1000, 1500)).toBe(false);
    expect(isDuplicateBarcode('0036000291452', '0036000291452', 1000, 2501)).toBe(false);
  });
});
