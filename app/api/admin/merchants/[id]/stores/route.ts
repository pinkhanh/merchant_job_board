import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';
import { parsePage } from '@/lib/constants/pagination';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const result = await listStores(params.id, {
    keyword: searchParams.get('keyword') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    district: searchParams.get('district') ?? undefined,
    page: parsePage(searchParams.get('page')),
  });
  return NextResponse.json(result);
}
