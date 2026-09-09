import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `SELECT * FROM vendedores ORDER BY nombre ASC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, vendedores: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo vendedores:", error);
    return NextResponse.json({ error: 'Error interno al cargar los vendedores.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    if (!data.nombre || !data.cedula || !data.telefono || !data.direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }
    const sql = `INSERT INTO vendedores (nombre, cedula, telefono, direccion) VALUES (?, ?, ?, ?)`;
    const valores = [data.nombre, data.cedula, data.telefono, data.direccion];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('vendedores:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Vendedores', entidad_id: resultado.insertId,
      descripcion: `Creó el vendedor "${data.nombre}" (Cédula: ${data.cedula})`,
      datos_nuevos: { nombre: data.nombre, cedula: data.cedula, telefono: data.telefono },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Vendedor registrado correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando vendedor:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un vendedor con esta cédula.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    if (!data.nombre || !data.cedula || !data.telefono || !data.direccion) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }

    const anterior: any = await query('SELECT id, nombre, cedula FROM vendedores WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    const sql = `UPDATE vendedores SET nombre = ?, cedula = ?, telefono = ?, direccion = ? WHERE id = ?`;
    const valores = [data.nombre, data.cedula, data.telefono, data.direccion, id];
    await query(sql, valores);
    emitSocketEvent('vendedores:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Vendedores', entidad_id: id,
      descripcion: `Editó el vendedor "${data.nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, cedula: old.cedula } : null,
      datos_nuevos: { nombre: data.nombre, cedula: data.cedula, telefono: data.telefono },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Vendedor actualizado correctamente.' });
  } catch (error: any) {
    console.error("Error actualizando vendedor:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe un vendedor con esta cédula.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor al actualizar el vendedor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, cedula FROM vendedores WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM vendedores WHERE id = ?', [id]);
    emitSocketEvent('vendedores:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Vendedores', entidad_id: parseInt(id),
      descripcion: `Eliminó el vendedor "${old?.nombre || id}"`,
      datos_anteriores: old ? { nombre: old.nombre, cedula: old.cedula } : null,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando vendedor:", error);
    return NextResponse.json({ error: 'Error interno del servidor al eliminar el vendedor.' }, { status: 500 });
  }
}
