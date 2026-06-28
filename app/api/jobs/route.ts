import { EmploymentType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { createJobPost, listJobPosts, PastDeadlineError } from '@/lib/services/jobPostService';
import { parsePage } from '@/lib/constants/pagination';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  try {
    const jobPost = await createJobPost(session.merchantId!, body);
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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get('page');
  const result = await listJobPosts(session.merchantId!, {
    status: (searchParams.get('status') as any) ?? undefined,
    storeId: searchParams.get('storeId') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    employmentType: (searchParams.get('employmentType') as EmploymentType) ?? undefined,
    jobCategory: searchParams.get('jobCategory') ?? undefined,
    createdFrom: searchParams.get('createdFrom') ?? undefined,
    createdTo: searchParams.get('createdTo') ?? undefined,
    page: parsePage(pageParam),
    all: pageParam === null,
  });
  return NextResponse.json(result);
}
