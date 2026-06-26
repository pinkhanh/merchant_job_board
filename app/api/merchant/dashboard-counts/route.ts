import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { countJobPostsByStatus } from '@/lib/services/jobPostService';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [jobCounts, totalApplicants] = await Promise.all([
    countJobPostsByStatus(session.merchantId!),
    prisma.application.count({
      where: { jobPost: { merchantId: session.merchantId! } },
    }),
  ]);

  return NextResponse.json({ ...jobCounts, totalApplicants });
}
