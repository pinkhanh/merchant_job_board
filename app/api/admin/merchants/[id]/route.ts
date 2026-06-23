import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { setMerchantStatus } from '@/lib/services/adminMerchantService';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();
  await setMerchantStatus(id, status);
  return NextResponse.json({ ok: true });
}
