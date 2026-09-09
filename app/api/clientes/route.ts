import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `SELECT id, nombre, rif, direccion, telefono, vendedor, es_contribuyente_especial AS esContribuyenteEspecial FROM clientes ORDER BY nombre ASC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, clientes: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json({ error: 'Error interno al cargar la lista de clientes.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    if (!data.nombre || !data.rif || !data.telefono || !data.direccion || !data.vendedor) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }
    const sql = `INSERT INTO clientes (nombre, rif, telefono, direccion, vendedor, es_contribuyente_especial) VALUES (?, ?, ?, ?, ?, ?)`;
    const valores = [data.nombre, data.rif, data.telefono, data.direccion, data.vendedor, data.esContribuyenteEspecial ? 1 : 0];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('clientes:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Clientes', entidad_id: resultado.insertId,
      descripcion: `Creó el cliente "${data.nombre}" (RIF: ${data.rif})`,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, telefono: data.telefono, vendedor: data.vendedor },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Cliente registrado correctamente en el sistema.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando cliente:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe una empresa o cliente registrado con este RIF/Cédula.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor al procesar el registro.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    if (!data.nombre || !data.rif || !data.telefono || !data.direccion || !data.vendedor) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }

    const anterior: any = await query('SELECT id, nombre, rif FROM clientes WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    const sql = `UPDATE clientes SET nombre = ?, rif = ?, telefono = ?, direccion = ?, vendedor = ?, es_contribuyente_especial = ? WHERE id = ?`;
    const valores = [data.nombre, data.rif, data.telefono, data.direccion, data.vendedor, data.esContribuyenteEspecial ? 1 : 0, id];
    await query(sql, valores);
    emitSocketEvent('clientes:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Clientes', entidad_id: id,
      descripcion: `Editó el cliente "${data.nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, rif: old.rif } : null,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, telefono: data.telefono, vendedor: data.vendedor },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Cliente actualizado correctamente.' });
  } catch (error: any) {
    console.error("Error actualizando cliente:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'Ya existe una empresa o cliente registrado con este RIF/Cédula.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor al actualizar el cliente.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });

    const anterior: any = await query('SELECT id, nombre, rif FROM clientes WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    await query('DELETE FROM clientes WHERE id = ?', [id]);
    emitSocketEvent('clientes:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Clientes', entidad_id: parseInt(id),
      descripcion: `Eliminó el cliente "${old?.nombre || id}"`,
      datos_anteriores: old ? { nombre: old.nombre, rif: old.rif } : null,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return NextResponse.json({ error: 'Error interno del servidor al eliminar el cliente.' }, { status: 500 });
  }
}
