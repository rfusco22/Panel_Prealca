import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { guardarMensaje, obtenerMensajes } from '@/lib/chat';
import { getIO } from '@/lib/socket-server';

// Historial de una conversación. ?con=general | <id de usuario> & antes=<id>
// Solo devuelve mensajes en los que participa el usuario de la sesión (o los
// del canal general): el `con` define con quién, no permite leer ajenos.
//
// Los mensajes se envían normalmente por WebSocket (evento chat:send, ver
// server.ts). El POST es un respaldo por si el socket no está conectado.
export const dynamic = 'force-dynamic';

function leerCon(v: string | null): number | null | undefined {
  if (!v || v === 'general') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const con = leerCon(searchParams.get('con'));
    if (con === undefined) return NextResponse.json({ error: 'Conversación inválida' }, { status: 400 });
    const antes = Number(searchParams.get('antes')) || null;
    const mensajes = await obtenerMensajes(Number(auth.session.userId), con, antes, 50);
    return NextResponse.json({ success: true, mensajes, hayMas: mensajes.length === 50 });
  } catch (error) {
    console.error('Error GET /api/chat/mensajes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  try {
    const body = await req.json();
    const to = leerCon(body?.to == null ? null : String(body.to));
    if (to === undefined) return NextResponse.json({ error: 'Destinatario inválido' }, { status: 400 });
    const userId = Number(auth.session.userId);
    const r = await guardarMensaje(userId, to, body?.contenido);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 });

    const io = getIO();
    if (io) {
      if (to === null) io.emit('chat:message', r.mensaje);
      else io.to(`user:${to}`).to(`user:${userId}`).emit('chat:message', r.mensaje);
    }
    return NextResponse.json({ success: true, mensaje: r.mensaje }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/chat/mensajes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
