import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant' || !session.merchantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const VALID_STATUSES = ['live', 'paused'] as const;
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const job = await prisma.jobPost.findFirst({
    where: { id, merchantId: session.merchantId },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.jobPost.update({
    where: { id },
    data: { status: body.status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant' || !session.merchantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const job = await prisma.jobPost.findFirst({
    where: { id, merchantId: session.merchantId },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.jobPost.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
