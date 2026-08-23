import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const sql = `
      SELECT id, nombre, rif, direccion, planta,
             clasificacion_gasto AS clasificacionGasto,
             es_contribuyente_especial AS esContribuyenteEspecial
      FROM proveedores
      ORDER BY nombre ASC
    `;
    const proveedores = await query(sql);
    return NextResponse.json({ success: true, proveedores }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return NextResponse.json({ error: 'Error interno al cargar la lista de proveedores.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.nombre || !data.rif) {
      return NextResponse.json({ error: 'El Nombre y el RIF son campos obligatorios.' }, { status: 400 });
    }
    const sql = `INSERT INTO proveedores (nombre, rif, direccion, planta, clasificacion_gasto, es_contribuyente_especial) VALUES (?, ?, ?, ?, ?, ?)`;
    const valores = [data.nombre, data.rif, data.direccion || null, data.planta || null, data.clasificacionGasto || null, data.esContribuyenteEspecial ? 1 : 0];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('proveedores:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Proveedores', entidad_id: resultado.insertId,
      descripcion: `Creó el proveedor "${data.nombre}" (RIF: ${data.rif})`,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, direccion: data.direccion, planta: data.planta },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Proveedor registrado correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando proveedor:', error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un proveedor registrado con este RIF.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor al procesar el registro.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, rif, direccion, planta FROM proveedores WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    const sql = `UPDATE proveedores SET nombre = ?, rif = ?, direccion = ?, planta = ?, clasificacion_gasto = ?, es_contribuyente_especial = ? WHERE id = ?`;
    const valores = [data.nombre, data.rif, data.direccion || null, data.planta || null, data.clasificacionGasto || null, data.esContribuyenteEspecial ? 1 : 0, id];
    await query(sql, valores);
    emitSocketEvent('proveedores:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Proveedores', entidad_id: id,
      descripcion: `Editó el proveedor "${data.nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, rif: old.rif, planta: old.planta } : null,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, planta: data.planta },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Proveedor actualizado correctamente.' });
  } catch (error: any) {
    console.error('Error actualizando proveedor:', error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un proveedor registrado con este RIF.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor al actualizar el proveedor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, rif FROM proveedores WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM proveedores WHERE id = ?', [id]);
    emitSocketEvent('proveedores:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Proveedores', entidad_id: parseInt(id),
      descripcion: `Eliminó el proveedor "${old?.nombre || id}"`,
      datos_anteriores: old ? { nombre: old.nombre, rif: old.rif } : null,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    return NextResponse.json({ error: 'Error interno del servidor al eliminar el proveedor.' }, { status: 500 });
  }
}
