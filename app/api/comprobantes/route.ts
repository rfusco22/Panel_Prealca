import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, type Rol } from '@/lib/auth-guard';
import { ensureTablaComprobantes } from '@/lib/comprobantes';

// Devuelve el archivo de un comprobante para verlo en el navegador.
//
// El permiso depende de a qué pertenece: un comprobante de ingreso lo ve quien
// puede leer ingresos, y uno de egreso quien puede leer egresos. Tiene que
// coincidir con el GET de /api/ingresos y /api/egresos; si esos cambian, este
// también. No alcanza con requireAuth() sin roles: un comprobante bancario no
// puede quedar al alcance de cualquier usuario logueado que adivine un id.
const ROLES_POR_TIPO: Record<string, readonly Rol[]> = {
  ingreso: ['admin', 'gerencia'],
  egreso: ['admin', 'gerencia'],
};

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  try {
    await ensureTablaComprobantes();
    const filas: any = await query(
      'SELECT tipo, nombre, mime, datos FROM comprobantes WHERE id = ?',
      [id],
    );
    const c = filas[0];
    // Mismo 404 exista o no el comprobante cuando el rol no puede verlo, para
    // no revelar qué ids existen.
    if (!c || !(ROLES_POR_TIPO[c.tipo] || []).includes(auth.session.role)) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    // El nombre viene del usuario: se limpia antes de ponerlo en un header.
    const nombreSeguro = String(c.nombre).replace(/[^\w.\- ]+/g, '_').slice(0, 150) || 'comprobante';
    return new NextResponse(new Uint8Array(c.datos), {
      status: 200,
      headers: {
        'Content-Type': c.mime,
        'Content-Disposition': `inline; filename="${nombreSeguro}"`,
        // El tipo ya se validó por los bytes al guardarlo; nosniff evita que el
        // navegador lo reinterprete como otra cosa (por ejemplo HTML).
        'X-Content-Type-Options': 'nosniff',
        // Es un documento financiero: que no quede en cachés compartidas.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error GET comprobante:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
