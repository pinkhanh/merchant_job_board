import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { countJobPostsByStatus } from '@/lib/services/jobPostService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const counts = await countJobPostsByStatus(session.merchantId!);
  return NextResponse.json(counts);
}
