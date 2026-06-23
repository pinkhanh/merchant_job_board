import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listApplications } from '@/lib/services/applicationService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const applications = await listApplications(session.merchantId!, {
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
  });
  return NextResponse.json(applications);
}
