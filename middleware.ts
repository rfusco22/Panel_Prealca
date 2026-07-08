import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rutas públicas: Acceso libre
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Verificar la única cookie que realmente usas: 'prealca-session'
  const sessionToken = request.cookies.get('prealca-session');

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 3. Dejamos pasar al admin. 
  // LA VALIDACIÓN DE ROL DEBE HACERSE EN app/admin/page.tsx (Server Component)
  // No hagas fetch aquí, eso causa bucles y errores de sintaxis.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};