import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

// No hay catálogo de precios: precioM3 es el precio negociado con el
// proveedor para esa orden puntual, así que se confía en lo que se registra.
// Lo que NO se confía es la aritmética que se deriva de ahí: antes ivaMonto y
// total llegaban del cliente sin relación real con cantidadM3 * precioM3, así
// que cualquier usuario podía mandar, por ejemplo, precioM3: 1000 con
// total: 0.01 y quedaba guardado tal cual.
function calcularTotalesOrdenCompra(cantidadM3: number, precioM3: number, ivaAplicado: boolean) {
  const subtotal = cantidadM3 * precioM3;
  const ivaMonto = ivaAplicado ? subtotal * 0.16 : 0;
  return { ivaMonto, total: subtotal + ivaMonto };
}

const SELECT_ORDEN_COMPRA = `SELECT oc.id, oc.tipo, oc.proveedor_id AS proveedorId, pv.nombre AS proveedorNombre, oc.producto_id AS productoId, CONCAT(pd.resistencia, ' - ', pd.pulgada) AS productoNombre, oc.cantidad_m3 AS cantidadM3, oc.precio_m3 AS precioM3, oc.iva_aplicado AS ivaAplicado, oc.iva_monto AS ivaMonto, oc.total, oc.usuario_id AS usuarioId, oc.created_at AS fecha FROM orden_compra oc LEFT JOIN proveedores pv ON oc.proveedor_id = pv.id LEFT JOIN productos pd ON oc.producto_id = pd.id`;

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const rows: any = await query(`${SELECT_ORDEN_COMPRA} WHERE oc.id = ?`, [id]);
      if (rows.length === 0) return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
      return NextResponse.json({ success: true, orden: rows[0] }, { status: 200 });
    }

    const ordenes = await query(`${SELECT_ORDEN_COMPRA} ORDER BY oc.id DESC`);
    return NextResponse.json({ success: true, ordenes }, { status: 200 });
  } catch (error) {
    console.error('Error GET orden_compra:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await request.json();
    const { tipo, proveedorId, productoId, ivaAplicado } = data;
    const cantidadM3 = parseFloat(data.cantidadM3);
    const precioM3 = parseFloat(data.precioM3);
    if (!Number.isFinite(cantidadM3) || cantidadM3 <= 0) {
      return NextResponse.json({ error: 'cantidadM3 inválida.' }, { status: 400 });
    }
    if (!Number.isFinite(precioM3) || precioM3 < 0) {
      return NextResponse.json({ error: 'precioM3 inválido.' }, { status: 400 });
    }
    const { ivaMonto, total } = calcularTotalesOrdenCompra(cantidadM3, precioM3, !!ivaAplicado);

    const result: any = await query(`INSERT INTO orden_compra (tipo, proveedor_id, producto_id, cantidad_m3, precio_m3, iva_aplicado, iva_monto, total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tipo, proveedorId, productoId, cantidadM3, precioM3, ivaAplicado ? 1 : 0, ivaMonto, total, auth.session.userId]);
    emitSocketEvent('orden-compra:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Órdenes de Compra', entidad_id: result.insertId,
      descripcion: `Creó orden de compra #${result.insertId} (${tipo}) - Bs. ${total}`,
      datos_nuevos: { tipo, proveedorId, productoId, cantidadM3, precioM3, total },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error POST orden_compra:', error);
    return NextResponse.json({ error: 'Error al crear orden de compra' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await request.json();
    const { id, tipo, proveedorId, productoId, ivaAplicado } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    const cantidadM3 = parseFloat(data.cantidadM3);
    const precioM3 = parseFloat(data.precioM3);
    if (!Number.isFinite(cantidadM3) || cantidadM3 <= 0) {
      return NextResponse.json({ error: 'cantidadM3 inválida.' }, { status: 400 });
    }
    if (!Number.isFinite(precioM3) || precioM3 < 0) {
      return NextResponse.json({ error: 'precioM3 inválido.' }, { status: 400 });
    }
    const { ivaMonto, total } = calcularTotalesOrdenCompra(cantidadM3, precioM3, !!ivaAplicado);

    const anterior: any = await query('SELECT id, tipo, proveedor_id, total FROM orden_compra WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(
      `UPDATE orden_compra SET tipo = ?, proveedor_id = ?, producto_id = ?, cantidad_m3 = ?, precio_m3 = ?, iva_aplicado = ?, iva_monto = ?, total = ? WHERE id = ?`,
      [tipo, proveedorId, productoId, cantidadM3, precioM3, ivaAplicado ? 1 : 0, ivaMonto, total, id]
    );
    emitSocketEvent('orden-compra:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Órdenes de Compra', entidad_id: id,
      descripcion: `Editó orden de compra #${id} (${tipo}) - Bs. ${total}`,
      datos_anteriores: old ? { tipo: old.tipo, proveedor_id: old.proveedor_id, total: old.total } : null,
      datos_nuevos: { tipo, proveedorId, productoId, cantidadM3, precioM3, total },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error PUT orden_compra:', error);
    return NextResponse.json({ error: 'Error al actualizar orden de compra' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const anterior: any = await query('SELECT id, tipo, proveedor_id, total FROM orden_compra WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM orden_compra WHERE id = ?', [id]);
    emitSocketEvent('orden-compra:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Órdenes de Compra', entidad_id: parseInt(id),
      descripcion: `Eliminó orden de compra #${id}`,
      datos_anteriores: old ? { tipo: old.tipo, proveedor_id: old.proveedor_id, total: old.total } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE orden_compra:', error);
    return NextResponse.json({ error: 'Error al eliminar orden de compra' }, { status: 500 });
  }
}
