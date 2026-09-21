import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';


// Restringido a admin, gerencia: devuelve las cuentas bancarias de la empresa.
//
// Hoy solo lo usan los formularios de ingreso y egreso, que viven en páginas de
// admin. Se incluye gerencia porque es el rol que audita esos movimientos y ya
// ve los mismos datos en sus reportes; el resto no tiene por qué listarlas.
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    const bancos = await query(
      'SELECT id, nombre_banco AS nombreBanco, numero_cuenta AS numeroCuenta FROM bancos ORDER BY nombre_banco ASC'
    );
    return NextResponse.json(bancos);
  } catch (error) {
    console.error('Error GET /api/bancos/select:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
