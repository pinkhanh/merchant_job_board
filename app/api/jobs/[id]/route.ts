import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth/getSession';
import { getJobPostById, pauseJobPost, reactivateJobPost, softDeleteJobPost } from '@/lib/services/jobPostService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const jobPost = await getJobPostById(id, session.merchantId!);
  if (!jobPost) {
    return NextResponse.json({ error: 'Job post not found' }, { status: 404 });
  }

  return NextResponse.json(jobPost);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  try {
    if (action === 'pause') await pauseJobPost(id, session.merchantId!);
    else if (action === 'reactivate') await reactivateJobPost(id, session.merchantId!);
    else if (action === 'delete') await softDeleteJobPost(id, session.merchantId!);
    else return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Job post not found' }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
