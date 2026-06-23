import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export const config = {
  matcher: ['/merchant/:path*', '/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  if (isAdminRoute && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (!isAdminRoute && session.role !== 'merchant') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}
