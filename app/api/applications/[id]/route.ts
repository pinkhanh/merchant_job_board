import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { updateImportStatus, ApplicationNotFoundError } from '@/lib/services/applicationService';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { importStatus } = await req.json();

  try {
    await updateImportStatus(id, session.merchantId!, importStatus);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    throw err;
  }
}
