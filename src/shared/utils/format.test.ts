import { describe, it, expect } from 'vitest';
import { round1dp } from '@/shared/utils/format';

describe('round1dp', () => {
  it('rounds to 1 decimal place', () => {
    expect(round1dp(3.14159)).toBe(3.1);
    expect(round1dp(2.789)).toBe(2.8);
    expect(round1dp(100)).toBe(100);
    expect(round1dp(0.05)).toBe(0.1);
    expect(round1dp(0.04)).toBe(0);
  });
});
