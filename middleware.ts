import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/forget', '/api/auth'];
const adminRoutes = ['/admin'];
const registroRoutes = ['/registro'];
const documentadorRoutes = ['/documentador'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. SOLUCIÓN: Permitir acceso a archivos de video e imágenes (public/...)
  if (pathname.endsWith('.mp4') || pathname.endsWith('.jpeg') || pathname.endsWith('.png')) {
    return NextResponse.next();
  }

  // 2. Permitir rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Verificar sesión
  const session = request.cookies.get('session');
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
};