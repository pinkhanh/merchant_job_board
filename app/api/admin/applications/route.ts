import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listAllApplications } from '@/lib/services/adminApplicationService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const applications = await listAllApplications({
    merchantId: searchParams.get('merchantId') ?? undefined,
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    jobPostTitle: searchParams.get('jobPostTitle') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
    appliedFrom: searchParams.get('appliedFrom') ?? undefined,
    appliedTo: searchParams.get('appliedTo') ?? undefined,
  });
  return NextResponse.json(applications);
}
