import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { exportAllApplicationsCsv } from '@/lib/services/adminApplicationService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csv = await exportAllApplicationsCsv({});
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
}
