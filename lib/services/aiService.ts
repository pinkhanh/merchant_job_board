import OpenAI from 'openai';

export type AiDescriptionInput = {
  title: string;
  industry: string;
  employmentType: string;
  requiredSkills?: string[];
  benefits?: string[];
  historicalJdText?: string;
};

export type AiDescriptionOutput = {
  roleOverview: string;
  requirements: string;
  benefits: string;
};

function templateFallback(input: AiDescriptionInput): AiDescriptionOutput {
  return {
    roleOverview: `Chúng tôi đang tìm ${input.title} làm việc trong ngành ${input.industry}.`,
    requirements: input.requiredSkills?.length ? input.requiredSkills.join(', ') : 'Không yêu cầu kinh nghiệm.',
    benefits: input.benefits?.length ? input.benefits.join(', ') : 'Lương thưởng cạnh tranh, môi trường làm việc thân thiện.',
  };
}

export async function generateDescription(input: AiDescriptionInput): Promise<AiDescriptionOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return templateFallback(input);

  const client = new OpenAI({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý viết mô tả công việc part-time/shift cho ngành F&B/Retail tại Việt Nam. Trả lời bằng JSON với 3 khoá: roleOverview, requirements, benefits.',
        },
        { role: 'user', content: JSON.stringify(input) },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return templateFallback(input);
    return JSON.parse(content) as AiDescriptionOutput;
  } catch {
    return templateFallback(input);
  }
}
