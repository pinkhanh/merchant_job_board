import { describe, it, expect } from 'vitest';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

describe('VIETNAM_PROVINCES', () => {
  it('has exactly 63 provinces/cities', () => {
    expect(Object.keys(VIETNAM_PROVINCES)).toHaveLength(63);
  });

  it('maps Hà Nội to its districts', () => {
    expect(VIETNAM_PROVINCES['Hà Nội']).toContain('Cầu Giấy');
  });

  it('maps TP. Hồ Chí Minh to its districts', () => {
    expect(VIETNAM_PROVINCES['TP. Hồ Chí Minh']).toContain('Quận 1');
    expect(VIETNAM_PROVINCES['TP. Hồ Chí Minh']).toContain('Bình Thạnh');
  });

  it('gives every province a non-empty district list', () => {
    for (const districts of Object.values(VIETNAM_PROVINCES)) {
      expect(districts.length).toBeGreaterThan(0);
    }
  });
});
