import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { getMerchantById, setMerchantStatus } from '@/lib/services/adminMerchantService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const merchant = await getMerchantById(id);
  if (!merchant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(merchant);
}

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
