import { NextResponse } from 'next/server';
import { login, InvalidCredentialsError, InactiveAccountError } from '@/lib/services/authService';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  try {
    const { token, role } = await login(username, password);
    const res = NextResponse.json({ ok: true, role });
    res.cookies.set('session', token, {
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
