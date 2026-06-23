import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { moderateJobPost, MissingReasonError, InvalidActionError } from '@/lib/services/adminJobPostService';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action, reason } = await req.json();
  try {
    await moderateJobPost(id, session.userId, action, reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof MissingReasonError) {
      return NextResponse.json({ error: 'Lý do là bắt buộc' }, { status: 400 });
    }
    if (err instanceof InvalidActionError) {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    }
    throw err;
  }
}
