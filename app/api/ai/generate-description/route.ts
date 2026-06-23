import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { generateDescription } from '@/lib/services/aiService';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const input = await req.json();
  const result = await generateDescription(input);
  return NextResponse.json(result);
}
