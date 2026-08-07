import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
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
