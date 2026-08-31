import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id');
    const facturaId = searchParams.get('factura_id');
    let sql = `SELECT r.*, c.nombre AS cliente_nombre, c.rif AS cliente_rif, f.total AS factura_total, f.fecha AS factura_fecha, f.estado AS factura_estado, gd.iva_monto AS iva_monto, gd.cantidad_m3, gd.precio_m3, p.resistencia, p.pulgada FROM retenciones_impuestos r JOIN clientes c ON r.cliente_id = c.id JOIN facturas f ON r.factura_id = f.id JOIN guia_despacho gd ON f.guia_despacho_id = gd.id JOIN productos p ON gd.producto_id = p.id WHERE 1=1`;
    const valores: any[] = [];
    if (clienteId) { sql += ` AND r.cliente_id = ?`; valores.push(clienteId); }
    if (facturaId) { sql += ` AND r.factura_id = ?`; valores.push(facturaId); }
    sql += ` ORDER BY r.id DESC`;
    const resultados = await query(sql, valores);
    return NextResponse.json({ success: true, retenciones: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo retenciones:", error);
    return NextResponse.json({ error: 'Error interno al cargar las retenciones.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();

    const montoRetenido = parseFloat(data.monto_retenido);
    const porcentajeRetencion = data.porcentaje_retencion !== undefined ? parseFloat(data.porcentaje_retencion) : 75;
    if (!Number.isFinite(montoRetenido) || montoRetenido < 0) {
      return NextResponse.json({ error: 'monto_retenido inválido.' }, { status: 400 });
    }
    if (!Number.isFinite(porcentajeRetencion) || porcentajeRetencion < 0 || porcentajeRetencion > 100) {
      return NextResponse.json({ error: 'porcentaje_retencion inválido.' }, { status: 400 });
    }

    // La factura no guarda el desglose de IVA (facturas solo tiene un total),
    // así que no hay de dónde recalcular monto_retenido desde cero. Lo que sí
    // se puede exigir sin inventar una fórmula: nunca se puede retener más de
    // lo que suma la factura completa.
    const facturas: any = await query('SELECT total FROM facturas WHERE id = ?', [data.factura_id]);
    if (facturas.length === 0) {
      return NextResponse.json({ error: 'La factura no existe.' }, { status: 400 });
    }
    if (montoRetenido > Number(facturas[0].total)) {
      return NextResponse.json({ error: 'monto_retenido no puede superar el total de la factura.' }, { status: 400 });
    }

    const sql = `INSERT INTO retenciones_impuestos (cliente_id, factura_id, monto_retenido, porcentaje_retencion, fecha, usuario_id) VALUES (?, ?, ?, ?, NOW(), ?)`;
    // usuario_id sale de la sesión, no del cuerpo del request: antes el
    // cliente podia mandar cualquier usuario_id (o dejar que cayera en el 1
    // por defecto) y la auditoria quedaba atribuida a otra persona.
    const valores = [data.cliente_id, data.factura_id, montoRetenido, porcentajeRetencion, auth.session.userId];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('retenciones:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Retenciones', entidad_id: resultado.insertId,
      descripcion: `Registró retención de Bs. ${montoRetenido} (Factura #${data.factura_id})`,
      datos_nuevos: { cliente_id: data.cliente_id, factura_id: data.factura_id, monto_retenido: montoRetenido, porcentaje_retencion: porcentajeRetencion },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Retención registrada correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando retención:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe una retención para esta factura.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
