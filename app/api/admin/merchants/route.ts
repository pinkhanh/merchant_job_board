import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listMerchants, createMerchant } from '@/lib/services/adminMerchantService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const merchants = await listMerchants({
    status: (searchParams.get('status') as any) ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
  });
  return NextResponse.json(merchants);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const result = await createMerchant(body);
  return NextResponse.json(result, { status: 201 });
}
