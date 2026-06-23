import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { exportApplicationsCsv } from '@/lib/services/applicationService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csv = await exportApplicationsCsv(session.merchantId!);
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
}
