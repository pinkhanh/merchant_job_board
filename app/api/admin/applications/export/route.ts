import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { exportAllApplicationsCsv } from '@/lib/services/adminApplicationService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    merchantId: searchParams.get('merchantId') ?? undefined,
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    jobPostTitle: searchParams.get('jobPostTitle') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
    appliedFrom: searchParams.get('appliedFrom') ?? undefined,
    appliedTo: searchParams.get('appliedTo') ?? undefined,
  };
  const csv = await exportAllApplicationsCsv(filters);

  // Count lines (subtract 1 for header)
  const applicantCount = Math.max(0, csv.split('\n').filter(Boolean).length - 1);
  const fileName = `admin-ung-vien-${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    const { createExportLog } = await import('@/lib/services/csvExportLogService');
    await createExportLog({ userId: session.userId, applicantCount, fileName, filters });
  } catch { /* best-effort */ }

  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${fileName}"` } });
}
