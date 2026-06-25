import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { listApplications, createApplication, DuplicateApplicationError } from '@/lib/services/applicationService';
import { parsePage } from '@/lib/constants/pagination';
import { ZodError } from 'zod';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = await listApplications(session.merchantId!, {
    jobPostId: searchParams.get('jobPostId') ?? undefined,
    jobPostTitle: searchParams.get('jobPostTitle') ?? undefined,
    importStatus: (searchParams.get('importStatus') as any) ?? undefined,
    appliedFrom: searchParams.get('appliedFrom') ?? undefined,
    appliedTo: searchParams.get('appliedTo') ?? undefined,
    page: parsePage(searchParams.get('page')),
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const application = await createApplication(body);
    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateApplicationError) {
      return NextResponse.json({ error: 'Bạn đã ứng tuyển vào vị trí này rồi.' }, { status: 409 });
    }
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    throw err;
  }
}
