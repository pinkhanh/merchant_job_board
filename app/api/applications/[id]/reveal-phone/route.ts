import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { revealPhone, ApplicationNotFoundError } from '@/lib/services/applicationService';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const phoneNumber = await revealPhone(id, session.merchantId!, session.userId);
    return NextResponse.json({ phoneNumber });
  } catch (err) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    throw err;
  }
}
