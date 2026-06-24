import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listStores(session.merchantId!, {
    keyword: searchParams.get('keyword') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    district: searchParams.get('district') ?? undefined,
    page: Number(searchParams.get('page') ?? '1'),
  });
  return NextResponse.json(result);
}
