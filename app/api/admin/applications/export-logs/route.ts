import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logs = await prisma.csvExportLog.findMany({
    orderBy: { exportedAt: 'desc' },
    take: 50,
  });

  // Extract merchantIds from filters JSON and look up brand names
  const merchantIds = [
    ...new Set(
      logs
        .map((l) => (l.filters as Record<string, string | undefined>)?.merchantId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const merchantMap: Record<string, string> = {};
  if (merchantIds.length > 0) {
    const merchants = await prisma.merchant.findMany({
      where: { id: { in: merchantIds } },
      select: { id: true, brandName: true },
    });
    for (const m of merchants) merchantMap[m.id] = m.brandName;
  }

  const result = logs.map((log) => ({
    id: log.id,
    fileName: log.fileName,
    exportedAt: log.exportedAt,
    applicantCount: log.applicantCount,
    brandName: merchantMap[(log.filters as Record<string, string | undefined>)?.merchantId ?? ''] ?? null,
  }));

  return NextResponse.json(result);
}
