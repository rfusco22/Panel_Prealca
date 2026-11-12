import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { obtenerContactos } from '@/lib/chat';

// Lista de conversaciones del usuario: canal General + un contacto por cada
// usuario del sistema, con el último mensaje y cuántos no leyó.
// Cualquier usuario logueado puede chatear.
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  try {
    const datos = await obtenerContactos(Number(auth.session.userId));
    return NextResponse.json({ success: true, yo: Number(auth.session.userId), ...datos });
  } catch (error) {
    console.error('Error GET /api/chat/contactos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
