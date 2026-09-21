import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';


// Control de acceso por rol y por metodo: lee de la tabla facturas. Solo las paginas de admin la llaman; se
// suma gerencia porque ve los mismos datos en sus reportes de retenciones.
//
// Antes todos los handlers usaban requireAuth() sin roles, o sea cualquier
// usuario logueado. En los endpoints con POST/PUT/DELETE eso significaba que
// se podia crear, editar y borrar escribiendo la URL, sin tener el boton.
// La lista de roles sale de que paginas llaman al endpoint de verdad.
export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    const sql = `
      SELECT 
        f.id,
        f.total,
        f.fecha,
        f.estado,
        f.comprobante_retencion,
        c.id AS cliente_id,
        c.nombre AS cliente_nombre,
        c.rif AS cliente_rif,
        c.es_contribuyente_especial,
        -- El IVA base de la retención es el de la factura. Antes se traía
        -- gd.iva_monto, el de la guía, que siempre vale 0 porque las guías se
        -- crean sin precio: toda retención se habría registrado en Bs 0.
        f.subtotal,
        f.iva_monto,
        gd.cantidad_m3,
        gd.precio_m3,
        p.resistencia,
        p.pulgada
      FROM facturas f
      JOIN clientes c ON f.cliente_id = c.id
      -- LEFT JOIN: la guía es opcional al facturar. Con JOIN, las facturas sin
      -- guía asociada no aparecían y no se les podía registrar la retención.
      LEFT JOIN guia_despacho gd ON f.guia_despacho_id = gd.id
      LEFT JOIN productos p ON gd.producto_id = p.id
      WHERE c.es_contribuyente_especial = 1
        AND f.estado != 'Anulada'
      ORDER BY f.id DESC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, facturas: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo facturas de contribuyentes:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
