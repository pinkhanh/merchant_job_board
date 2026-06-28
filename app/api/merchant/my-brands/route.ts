import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assignments = await prisma.userMerchant.findMany({
    where: { userId: session.userId },
    include: { merchant: { select: { id: true, brandName: true, logoUrl: true } } },
  });

  return NextResponse.json({
    items: assignments.map((a) => a.merchant),
  });
}
