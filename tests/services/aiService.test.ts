// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

import { generateDescription } from '@/lib/services/aiService';

describe('aiService.generateDescription', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('returns the parsed AI output on success', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ roleOverview: 'A', requirements: 'B', benefits: 'C' }) } }],
    });

    const result = await generateDescription({ title: 'Nhân viên pha chế', industry: 'F&B', employmentType: 'shift' });
    expect(result).toEqual({ roleOverview: 'A', requirements: 'B', benefits: 'C' });
  });

  it('falls back to a template when the OpenAI call throws', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));

    const result = await generateDescription({ title: 'Nhân viên pha chế', industry: 'F&B', employmentType: 'shift' });
    expect(result.roleOverview).toContain('Nhân viên pha chế');
  });

  it('falls back to a template when OPENAI_API_KEY is not set', async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await generateDescription({ title: 'Thu ngân', industry: 'Retail', employmentType: 'part_time' });
    expect(result.roleOverview).toContain('Thu ngân');
  });
});
