import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const [clientes, vendedores, productos] = await Promise.all([
      query('SELECT id, nombre, rif, vendedor FROM clientes ORDER BY nombre ASC'),
      query('SELECT DISTINCT vendedor FROM clientes WHERE vendedor IS NOT NULL AND vendedor != "" ORDER BY vendedor ASC'),
      query('SELECT id, resistencia, pulgada, unidad FROM productos ORDER BY resistencia ASC'),
    ]);

    return NextResponse.json({
      clientes: clientes as any[],
      vendedores: (vendedores as any[]).map((v: any) => v.vendedor),
      productos: productos as any[],
    });
  } catch (error) {
    console.error('Error GET /api/clientes/select:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
