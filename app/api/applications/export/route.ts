import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { exportApplicationsCsv } from '@/lib/services/applicationService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const csv = await exportApplicationsCsv(session.merchantId!, {
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    jobPostTitle: searchParams.get('jobPostTitle') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
    appliedFrom: searchParams.get('appliedFrom') ?? undefined,
    appliedTo: searchParams.get('appliedTo') ?? undefined,
  });
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
}
