const BARCODE_LENGTHS = new Set([8, 12, 13]);

function stripBarcode(value: string) {
  return value.replace(/[^0-9]/g, '');
}

function hasValidGtinChecksum(value: string) {
  let sum = 0;
  let weight = 3;

  for (let i = value.length - 2; i >= 0; i--) {
    sum += Number(value[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const expected = (10 - (sum % 10)) % 10;
  return expected === Number(value[value.length - 1]);
}

export function normalizeBarcode(value: string) {
  const digits = stripBarcode(value);
  if (!BARCODE_LENGTHS.has(digits.length)) return null;
  if (!hasValidGtinChecksum(digits)) return null;

  if (digits.length === 12) {
    return `0${digits}`;
  }

  return digits;
}

export function isSupportedBarcode(value: string) {
  return normalizeBarcode(value) !== null;
}
