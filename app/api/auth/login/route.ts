import { NextResponse } from 'next/server';
import { login, InvalidCredentialsError, InactiveAccountError } from '@/lib/services/authService';
import { createTempSessionToken } from '@/lib/auth/session';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  try {
    const result = await login(username, password);

    if (result.requiresBrandSelection) {
      const tempToken = await createTempSessionToken({ userId: result.userId });
      const response = NextResponse.json({ ok: true, requiresBrandSelection: true });
      response.cookies.set('temp_session', tempToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 300,
      });
      return response;
    }

    const res = NextResponse.json({ ok: true, role: result.role });
    res.cookies.set('session', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    if (err instanceof InactiveAccountError) {
      return NextResponse.json({ error: 'Tài khoản đã bị khoá' }, { status: 403 });
    }
    if (err instanceof InvalidCredentialsError) {
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
    }
    throw err;
  }
}
