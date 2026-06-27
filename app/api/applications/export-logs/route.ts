import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listExportLogs } from '@/lib/services/csvExportLogService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const logs = await listExportLogs({ userId: session.userId });
  return NextResponse.json(logs);
}
