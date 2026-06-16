import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rutas públicas
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Validación de existencia de cookie
  const sessionCookie = request.cookies.get(sessionOptions.cookieName);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si llega aquí, la cookie existe, dejamos pasar al Server Component
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};