import { type NextRequest } from 'next/server';
import { verifyTempSessionToken, type TempSessionPayload } from '@/lib/auth/session';

export async function getTempSession(req: NextRequest): Promise<TempSessionPayload | null> {
  const token = req.cookies.get('temp_session')?.value;
  if (!token) return null;
  return verifyTempSessionToken(token);
}
