import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const facturas = await query(`SELECT f.id, f.guia_despacho_id AS guiaDespachoId, f.cliente_id AS clienteId, c.nombre AS clienteNombre, f.forma_pago AS formaPago, f.comprobante_retencion AS comprobanteRetencion, f.total, f.usuario_id AS usuarioId, f.created_at AS fecha FROM facturas f LEFT JOIN clientes c ON f.cliente_id = c.id ORDER BY f.id DESC`);
    return NextResponse.json({ success: true, facturas }, { status: 200 });
  } catch (error) {
    console.error('Error GET facturas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await request.json();
    const { guiaDespachoId, clienteId, formaPago, comprobanteRetencion } = data;

    // facturas solo guarda un total (no hay desglose de items en la tabla),
    // así que no hay una fórmula server-side de la que derivarlo — a
    // diferencia de orden_compra, acá no hay cantidad*precio en esta misma
    // request. Lo mínimo exigible sin inventar una regla de negocio: que sea
    // un número real y no negativo.
    const total = parseFloat(data.total);
    if (!Number.isFinite(total) || total < 0) {
      return NextResponse.json({ error: 'total inválido.' }, { status: 400 });
    }

    const result: any = await query(`INSERT INTO facturas (guia_despacho_id, cliente_id, forma_pago, comprobante_retencion, total, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`, [guiaDespachoId || null, clienteId, formaPago, comprobanteRetencion || null, total, auth.session.userId]);
    emitSocketEvent('facturas:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Facturas', entidad_id: result.insertId,
      descripcion: `Creó factura #${result.insertId} - Total: Bs. ${total}`,
      datos_nuevos: { clienteId, formaPago, total, comprobanteRetencion },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, mensaje: 'Factura creada correctamente', id: result.insertId, formaPago }, { status: 201 });
  } catch (error) {
    console.error('Error POST facturas:', error);
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 });
  }
}
