import { NextResponse } from 'next/server';
import { getPublicJobPostById } from '@/lib/services/jobPostService';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobPost = await getPublicJobPostById(id);
  if (!jobPost) {
    return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng' }, { status: 404 });
  }
  return NextResponse.json(jobPost);
}
