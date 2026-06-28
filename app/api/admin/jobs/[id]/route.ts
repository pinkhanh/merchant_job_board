import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const job = await prisma.jobPost.findFirst({
    where: { id, deletedAt: null },
    include: {
      merchant: { select: { brandName: true, logoUrl: true } },
      jobPostStores: {
        include: {
          store: { select: { name: true, streetAddress: true, ward: true, district: true, city: true } },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
