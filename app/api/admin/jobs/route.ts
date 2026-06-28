import { EmploymentType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { listAllJobPosts, createJobPostAsAdmin } from '@/lib/services/adminJobPostService';
import { PastDeadlineError } from '@/lib/services/jobPostService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobPosts = await listAllJobPosts({
    merchantId: searchParams.get('merchantId') ?? undefined,
    status: (searchParams.get('status') as any) ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    employmentType: (searchParams.get('employmentType') as EmploymentType) ?? undefined,
    jobCategory: searchParams.get('jobCategory') ?? undefined,
    storeId: searchParams.get('storeId') ?? undefined,
    createdFrom: searchParams.get('createdFrom') ?? undefined,
    createdTo: searchParams.get('createdTo') ?? undefined,
  });
  return NextResponse.json(jobPosts);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { merchantId, ...rest } = body;
    if (!merchantId) return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    const jobPost = await createJobPostAsAdmin(merchantId, rest);
    return NextResponse.json(jobPost, { status: 201 });
  } catch (err) {
    if (err instanceof PastDeadlineError) {
      return NextResponse.json({ error: 'Hạn nộp hồ sơ phải ở tương lai' }, { status: 400 });
    }
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    throw err;
  }
}
