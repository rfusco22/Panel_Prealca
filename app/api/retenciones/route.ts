import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';


// Restringido a admin, gerencia: este endpoint expone retenciones de IVA por factura y por cliente.
//
// Antes era requireAuth() sin roles, o sea cualquier usuario logueado.
// Eso dejaba a un dosificador o a Seguridad Vial leerlo escribiendo la
// URL, aunque no tuvieran el link en su menú. La lista de roles sale de
// qué páginas lo llaman de verdad, no de suponer quién debería.
export async function GET(req: Request) {
  const auth = await requireAuth(['admin', 'gerencia']);
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
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    const data = await req.json();

    const porcentajeRetencion = data.porcentaje_retencion !== undefined ? parseFloat(data.porcentaje_retencion) : 75;
    if (!Number.isFinite(porcentajeRetencion) || porcentajeRetencion < 0 || porcentajeRetencion > 100) {
      return NextResponse.json({ error: 'porcentaje_retencion inválido.' }, { status: 400 });
    }

    // El monto retenido se calcula acá, sobre el IVA de la factura, y no se toma
    // el que manda la pantalla. Antes no había de dónde recalcularlo porque la
    // factura no guardaba el IVA, pero ahora sí (facturas.iva_monto). Y la
    // pantalla calculaba sobre el IVA de la guía, que siempre vale 0: sin esto
    // cada retención habría quedado registrada en Bs 0.
    //
    // El cliente también sale de la factura: si la pantalla mandara otro, la
    // retención quedaría a nombre de alguien que no es el dueño de la factura.
    const facturas: any = await query('SELECT cliente_id, iva_monto FROM facturas WHERE id = ?', [data.factura_id]);
    if (facturas.length === 0) {
      return NextResponse.json({ error: 'La factura no existe.' }, { status: 400 });
    }
    if (facturas[0].iva_monto == null) {
      return NextResponse.json({ error: 'La factura no tiene el IVA registrado; no se puede calcular la retención.' }, { status: 400 });
    }
    const montoRetenido = Math.round(Number(facturas[0].iva_monto) * porcentajeRetencion) / 100;
    const clienteId = facturas[0].cliente_id;

    const sql = `INSERT INTO retenciones_impuestos (cliente_id, factura_id, monto_retenido, porcentaje_retencion, fecha, usuario_id) VALUES (?, ?, ?, ?, NOW(), ?)`;
    // usuario_id sale de la sesión, no del cuerpo del request: antes el
    // cliente podia mandar cualquier usuario_id (o dejar que cayera en el 1
    // por defecto) y la auditoria quedaba atribuida a otra persona.
    const valores = [clienteId, data.factura_id, montoRetenido, porcentajeRetencion, auth.session.userId];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('retenciones:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Retenciones', entidad_id: resultado.insertId,
      descripcion: `Registró retención de Bs. ${montoRetenido} (Factura #${data.factura_id})`,
      datos_nuevos: { cliente_id: clienteId, factura_id: data.factura_id, monto_retenido: montoRetenido, porcentaje_retencion: porcentajeRetencion },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Retención registrada correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando retención:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe una retención para esta factura.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
