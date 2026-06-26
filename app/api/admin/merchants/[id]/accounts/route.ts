import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import {
  listMerchantAccounts,
  createMerchantAccount,
  UsernameConflictError,
} from '@/lib/services/adminMerchantService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const accounts = await listMerchantAccounts(id);
  return NextResponse.json(accounts);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  try {
    const account = await createMerchantAccount(id, body);
    return NextResponse.json(account, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    if (e instanceof UsernameConflictError) return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
    throw e;
  }
}
