import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { pauseJobPost, reactivateJobPost, softDeleteJobPost } from '@/lib/services/jobPostService';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action === 'pause') await pauseJobPost(id);
  else if (action === 'reactivate') await reactivateJobPost(id);
  else if (action === 'delete') await softDeleteJobPost(id);
  else return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
