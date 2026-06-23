import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { getMerchantProfile, updateMerchantProfile } from '@/lib/services/merchantProfileService';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getMerchantProfile(session.merchantId!);
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'merchant') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const updated = await updateMerchantProfile(session.merchantId!, data);
  return NextResponse.json(updated);
}
