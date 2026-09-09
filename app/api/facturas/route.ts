import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

// facturas solo tenia guia_despacho_id, cliente_id, forma_pago,
// comprobante_retencion y total: no habia donde guardar el subtotal ni el IVA
// por separado, asi que una factura editada no podia mostrar de nuevo el
// monto que el usuario habia tipeado. `estado` ya lo usa el modulo de
// retenciones (WHERE f.estado != 'Anulada') pero esta ruta nunca lo tocaba.
async function ensureColumns() {
  try { await query(`ALTER TABLE facturas ADD COLUMN subtotal DECIMAL(14,2) NULL`); } catch {}
  try { await query(`ALTER TABLE facturas ADD COLUMN iva_monto DECIMAL(14,2) NULL`); } catch {}
  try { await query(`ALTER TABLE facturas ADD COLUMN monto_retencion DECIMAL(14,2) NULL`); } catch {}
  try { await query(`ALTER TABLE facturas ADD COLUMN fecha_vencimiento DATE NULL`); } catch {}
  try { await query(`ALTER TABLE facturas ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente'`); } catch {}
}

const SELECT_FACTURA = `SELECT f.id, f.guia_despacho_id AS guiaDespachoId, f.cliente_id AS clienteId, c.nombre AS clienteNombre, c.rif AS clienteRif, f.forma_pago AS formaPago, f.comprobante_retencion AS comprobanteRetencion, f.subtotal, f.iva_monto AS ivaMonto, f.monto_retencion AS montoRetencion, f.fecha_vencimiento AS fechaVencimiento, f.estado, f.total, f.usuario_id AS usuarioId, f.created_at AS fecha FROM facturas f LEFT JOIN clientes c ON f.cliente_id = c.id`;

// El total no se confia del cliente: se deriva siempre de subtotal + el
// es_contribuyente_especial autoritativo del cliente en la BD, igual que
// orden_compra deriva su total de cantidad*precio en vez de aceptarlo suelto.
function calcularTotalesFactura(subtotal: number, esContribuyenteEspecial: boolean) {
  const ivaMonto = subtotal * 0.16;
  const montoRetencion = esContribuyenteEspecial ? ivaMonto * 0.75 : 0;
  return { ivaMonto, montoRetencion, total: subtotal + ivaMonto - montoRetencion };
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const rows: any = await query(`${SELECT_FACTURA} WHERE f.id = ?`, [id]);
      if (rows.length === 0) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, factura: rows[0] }, { status: 200 });
    }

    const facturas = await query(`${SELECT_FACTURA} ORDER BY f.id DESC`);
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
    await ensureColumns();
    const data = await request.json();
    const { clienteId, guiaDespachoId, formaPago, comprobanteRetencion, fechaVencimiento } = data;

    if (!clienteId || !formaPago) {
      return NextResponse.json({ error: 'Cliente y forma de pago son obligatorios.' }, { status: 400 });
    }
    const subtotal = parseFloat(data.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: 'El monto (subtotal) es inválido.' }, { status: 400 });
    }

    const clientes: any = await query('SELECT es_contribuyente_especial FROM clientes WHERE id = ?', [clienteId]);
    if (clientes.length === 0) return NextResponse.json({ error: 'El cliente no existe.' }, { status: 400 });
    const esContribuyenteEspecial = !!clientes[0].es_contribuyente_especial;

    const { ivaMonto, montoRetencion, total } = calcularTotalesFactura(subtotal, esContribuyenteEspecial);

    const result: any = await query(
      `INSERT INTO facturas (guia_despacho_id, cliente_id, forma_pago, comprobante_retencion, subtotal, iva_monto, monto_retencion, fecha_vencimiento, total, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?)`,
      [guiaDespachoId || null, clienteId, formaPago, comprobanteRetencion || null, subtotal, ivaMonto, montoRetencion, fechaVencimiento || null, total, auth.session.userId]
    );
    emitSocketEvent('facturas:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Facturas', entidad_id: result.insertId,
      descripcion: `Creó factura #${result.insertId} - Total: Bs. ${total}`,
      datos_nuevos: { clienteId, formaPago, subtotal, total, comprobanteRetencion },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, mensaje: 'Factura creada correctamente', id: result.insertId, formaPago }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST facturas:', error);
    return NextResponse.json({ error: 'Error al crear factura', debug: { message: error?.message, code: error?.code, sqlMessage: error?.sqlMessage } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const data = await request.json();
    const { id, clienteId, guiaDespachoId, formaPago, comprobanteRetencion, fechaVencimiento } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    if (!clienteId || !formaPago) {
      return NextResponse.json({ error: 'Cliente y forma de pago son obligatorios.' }, { status: 400 });
    }
    const subtotal = parseFloat(data.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: 'El monto (subtotal) es inválido.' }, { status: 400 });
    }

    const clientes: any = await query('SELECT es_contribuyente_especial FROM clientes WHERE id = ?', [clienteId]);
    if (clientes.length === 0) return NextResponse.json({ error: 'El cliente no existe.' }, { status: 400 });
    const esContribuyenteEspecial = !!clientes[0].es_contribuyente_especial;

    const { ivaMonto, montoRetencion, total } = calcularTotalesFactura(subtotal, esContribuyenteEspecial);

    const anterior: any = await query('SELECT id, cliente_id, total FROM facturas WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(
      `UPDATE facturas SET guia_despacho_id = ?, cliente_id = ?, forma_pago = ?, comprobante_retencion = ?, subtotal = ?, iva_monto = ?, monto_retencion = ?, fecha_vencimiento = ?, total = ? WHERE id = ?`,
      [guiaDespachoId || null, clienteId, formaPago, comprobanteRetencion || null, subtotal, ivaMonto, montoRetencion, fechaVencimiento || null, total, id]
    );
    emitSocketEvent('facturas:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Facturas', entidad_id: id,
      descripcion: `Editó factura #${id} - Total: Bs. ${total}`,
      datos_anteriores: old ? { cliente_id: old.cliente_id, total: old.total } : null,
      datos_nuevos: { clienteId, formaPago, subtotal, total, comprobanteRetencion },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, mensaje: 'Factura actualizada correctamente.' }, { status: 200 });
  } catch (error) {
    console.error('Error PUT facturas:', error);
    return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, cliente_id, total FROM facturas WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM facturas WHERE id = ?', [id]);
    emitSocketEvent('facturas:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Facturas', entidad_id: parseInt(id),
      descripcion: `Eliminó factura #${id}`,
      datos_anteriores: old ? { cliente_id: old.cliente_id, total: old.total } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE facturas:', error);
    return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 });
  }
}
