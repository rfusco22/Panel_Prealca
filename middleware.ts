import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/login', '/api/auth'];
const adminRoutes = ['/admin'];
const registroRoutes = ['/registro'];
const documentadorRoutes = ['/documentador'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir API routes de auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Verificar sesión
  const session = request.cookies.get('session');
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // En una implementación real, aquí verificarías el rol del usuario
  // Por ahora, permitimos acceso a todas las rutas autenticadas
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)',
  ],
};
