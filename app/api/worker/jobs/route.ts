import { NextResponse } from 'next/server';
import { listPublicJobPosts } from '@/lib/services/jobPostService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const employmentTypeParam = searchParams.get('employmentType');

  const result = await listPublicJobPosts({
    city: searchParams.get('city') ?? undefined,
    district: searchParams.get('district') ?? undefined,
    lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
    lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    radiusKm: searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined,
    employmentTypes: employmentTypeParam ? (employmentTypeParam.split(',') as any) : undefined,
    minSalary: searchParams.get('minSalary') ? Number(searchParams.get('minSalary')) : undefined,
    industry: searchParams.get('industry') ?? undefined,
    merchantId: searchParams.get('merchantId') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
  });

  return NextResponse.json(result);
}
