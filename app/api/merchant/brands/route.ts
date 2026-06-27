import { type NextRequest, NextResponse } from 'next/server';
import { getTempSession } from '@/lib/auth/getTempSession';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const tempSession = await getTempSession(req);
  if (!tempSession?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assignments = await prisma.userMerchant.findMany({
    where: { userId: tempSession.userId },
    include: { merchant: { select: { id: true, brandName: true, logoUrl: true } } },
  });

  return NextResponse.json({
    items: assignments.map(a => a.merchant),
  });
}
