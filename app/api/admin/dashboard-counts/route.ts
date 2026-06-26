import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalMerchants, activeMerchants, liveJobs, totalApplications] = await Promise.all([
    prisma.merchant.count(),
    prisma.merchant.count({ where: { status: 'active' } }),
    prisma.jobPost.count({ where: { status: 'live', deletedAt: null } }),
    prisma.application.count(),
  ]);

  return NextResponse.json({ totalMerchants, activeMerchants, liveJobs, totalApplications });
}
