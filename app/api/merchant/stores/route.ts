import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listStores } from '@/lib/services/storeService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stores = await listStores(session.merchantId!);
  return NextResponse.json(stores);
}
