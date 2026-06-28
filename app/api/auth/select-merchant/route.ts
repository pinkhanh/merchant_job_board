import { type NextRequest, NextResponse } from 'next/server';
import { getTempSession } from '@/lib/auth/getTempSession';
import { getSession } from '@/lib/auth/getSession';
import { createSessionToken } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const tempSession = await getTempSession(req);
  const fullSession = !tempSession?.userId ? await getSession() : null;
  const userId = tempSession?.userId ?? fullSession?.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { merchantId } = await req.json();
  if (!merchantId) return NextResponse.json({ error: 'merchantId required' }, { status: 400 });

  // Verify this user actually has access to the chosen merchant
  const assignment = await prisma.userMerchant.findUnique({
    where: {
      userId_merchantId: { userId, merchantId },
    },
  });
  if (!assignment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Issue full session
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sessionToken = await createSessionToken({
    userId: user.id,
    role: user.role as 'merchant' | 'admin',
    merchantId,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.delete('temp_session');
  return response;
}
