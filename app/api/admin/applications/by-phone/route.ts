import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

  const apps = await prisma.application.findMany({
    where: { phoneNumber: phone },
    include: {
      jobPost: { select: { title: true, merchant: { select: { brandName: true } } } },
    },
    orderBy: { appliedAt: 'desc' },
  });

  const first = apps[0];
  return NextResponse.json({
    applicantName: first?.applicantName ?? '',
    phoneNumber: phone,
    items: apps.map(a => ({
      id: a.id,
      jobTitle: a.jobPost?.title ?? '—',
      merchantName: a.jobPost?.merchant?.brandName ?? '—',
      appliedAt: a.appliedAt,
    })),
  });
}
