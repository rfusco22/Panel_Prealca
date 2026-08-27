import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
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
