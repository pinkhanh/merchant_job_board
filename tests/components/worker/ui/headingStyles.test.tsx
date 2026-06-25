import { describe, it, expect } from 'vitest';
import { headingStyles } from '@/components/worker/ui/headingStyles';

describe('headingStyles', () => {
  it('exports a page and sub style string', () => {
    expect(typeof headingStyles.page).toBe('string');
    expect(typeof headingStyles.sub).toBe('string');
  });

  it('the page style includes the worker primary color class', () => {
    expect(headingStyles.page).toContain('worker-primary');
  });
});
