import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listAllJobPosts } from '@/lib/services/adminJobPostService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobPosts = await listAllJobPosts({
    merchantId: searchParams.get('merchantId') ?? undefined,
    status: (searchParams.get('status') as any) ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
  });
  return NextResponse.json(jobPosts);
}
