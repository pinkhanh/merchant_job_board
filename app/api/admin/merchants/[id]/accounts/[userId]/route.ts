import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import {
  updateMerchantAccount,
  deleteMerchantAccount,
  LastAccountError,
} from '@/lib/services/adminMerchantService';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, userId } = await params;
  const body = await req.json();
  await updateMerchantAccount(id, userId, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, userId } = await params;
  try {
    await deleteMerchantAccount(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof LastAccountError) {
      return NextResponse.json({ error: 'Phải có ít nhất 1 tài khoản' }, { status: 409 });
    }
    throw e;
  }
}
