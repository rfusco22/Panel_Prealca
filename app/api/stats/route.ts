import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';


// Restringido a admin, gerencia, registro: contadores del dashboard. Son COUNT(*) sin montos, asi que el riesgo
// es bajo; se limita igual porque no hay razon para que un rol vea el tamaño
// de tablas que no usa.
//
// Antes era requireAuth() sin roles: cualquier usuario logueado lo podia
// leer escribiendo la URL. No expone montos -por eso quedo para el final-
// pero no hay motivo para dejarlo abierto a roles que no lo usan.
export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia', 'registro']);
  if (auth.response) return auth.response;

  try {
    const [clientes]: any = await query('SELECT COUNT(*) as total FROM clientes');
    const [proveedores]: any = await query('SELECT COUNT(*) as total FROM proveedores');
    const [vendedores]: any = await query('SELECT COUNT(*) as total FROM vendedores');
    const [facturas]: any = await query('SELECT COUNT(*) as total FROM facturas');
    const [ordenes]: any = await query('SELECT COUNT(*) as total FROM orden_compra');
    const [bancos]: any = await query('SELECT COUNT(*) as total FROM bancos');

    return NextResponse.json({
      success: true,
      stats: {
        clientes: clientes.total,
        proveedores: proveedores.total,
        vendedores: vendedores.total,
        facturas: facturas.total,
        ordenes: ordenes.total,
        bancos: bancos.total,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ success: false, stats: {} }, { status: 500 });
  }
}
