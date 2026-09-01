import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const productos: any = await query(`SELECT id, resistencia, pulgada, unidad FROM productos ORDER BY id DESC`);
    for (let i = 0; i < productos.length; i++) {
      const formula = await query(`SELECT pf.agregado_id AS agregadoId, a.nombre, pf.cantidad, a.unidad_medida AS unidadMedida FROM producto_formulas pf INNER JOIN agregados a ON pf.agregado_id = a.id WHERE pf.producto_id = ?`, [productos[i].id]);
      productos[i].formula = formula;
    }
    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error GET productos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { resistencia, pulgada, unidad, formula } = await request.json();
    if (!resistencia || !pulgada || !unidad) return NextResponse.json({ error: 'Datos básicos obligatorios' }, { status: 400 });
    const result: any = await query(`INSERT INTO productos (resistencia, pulgada, unidad) VALUES (?, ?, ?)`, [resistencia, pulgada, unidad]);
    const productoId = result.insertId;
    if (formula && formula.length > 0) {
      for (const item of formula) {
        await query(`INSERT INTO producto_formulas (producto_id, agregado_id, cantidad) VALUES (?, ?, ?)`, [productoId, item.agregadoId, item.cantidad]);
      }
    }
    emitSocketEvent('productos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Productos', entidad_id: productoId,
      descripcion: `Creó el producto "${resistencia} - ${pulgada}"`,
      datos_nuevos: { resistencia, pulgada, unidad, formula: formula?.length || 0 },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, id: productoId });
  } catch (error) {
    console.error('Error POST productos:', error);
    return NextResponse.json({ error: 'Error registrando producto' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { id, resistencia, pulgada, unidad, formula } = await request.json();

    const anterior: any = await query('SELECT id, resistencia, pulgada, unidad FROM productos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query(`UPDATE productos SET resistencia = ?, pulgada = ?, unidad = ? WHERE id = ?`, [resistencia, pulgada, unidad, id]);
    await query('DELETE FROM producto_formulas WHERE producto_id = ?', [id]);
    if (formula && formula.length > 0) {
      for (const item of formula) {
        await query(`INSERT INTO producto_formulas (producto_id, agregado_id, cantidad) VALUES (?, ?, ?)`, [id, item.agregadoId, item.cantidad]);
      }
    }
    emitSocketEvent('productos:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Productos', entidad_id: id,
      descripcion: `Editó el producto "${resistencia} - ${pulgada}"`,
      datos_anteriores: old ? { resistencia: old.resistencia, pulgada: old.pulgada, unidad: old.unidad } : null,
      datos_nuevos: { resistencia, pulgada, unidad },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error PUT productos:', error);
    return NextResponse.json({ error: 'Error actualizando producto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const anterior: any = await query('SELECT id, resistencia, pulgada FROM productos WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM productos WHERE id = ?', [id]);
    emitSocketEvent('productos:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Productos', entidad_id: parseInt(id || '0'),
      descripcion: `Eliminó el producto "${old?.resistencia || ''} - ${old?.pulgada || id}"`,
      datos_anteriores: old ? { resistencia: old.resistencia, pulgada: old.pulgada } : null,
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ error: 'Error eliminando producto' }, { status: 500 });
  }
}
