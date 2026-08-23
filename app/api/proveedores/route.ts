import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
  try {
    const proveedoresRaw: any = await query(`
      SELECT id, nombre, rif, direccion,
             clasificacion_gasto AS clasificacionGasto,
             es_contribuyente_especial AS esContribuyenteEspecial
      FROM proveedores
      ORDER BY nombre ASC
    `);

    const proveedores = await Promise.all(proveedoresRaw.map(async (p: any) => {
      const plantas: any = await query('SELECT id, nombre FROM proveedor_plantas WHERE proveedor_id = ?', [p.id]);
      const agregados: any = await query(
        `SELECT pa.agregado_id AS id, a.nombre
         FROM proveedor_agregados pa
         INNER JOIN agregados a ON pa.agregado_id = a.id
         WHERE pa.proveedor_id = ?`, [p.id]
      );
      return { ...p, plantas, agregados };
    }));

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

    const sql = `INSERT INTO proveedores (nombre, rif, direccion, clasificacion_gasto, es_contribuyente_especial) VALUES (?, ?, ?, ?, ?)`;
    const valores = [data.nombre, data.rif, data.direccion || null, data.clasificacionGasto || null, data.esContribuyenteEspecial ? 1 : 0];
    const resultado: any = await query(sql, valores);
    const proveedorId = resultado.insertId;

    // Insertar plantas
    if (Array.isArray(data.plantas) && data.plantas.length > 0) {
      for (const planta of data.plantas) {
        if (planta && planta.trim()) {
          await query('INSERT INTO proveedor_plantas (proveedor_id, nombre) VALUES (?, ?)', [proveedorId, planta.trim()]);
        }
      }
    }

    // Insertar agregados
    if (Array.isArray(data.agregados) && data.agregados.length > 0) {
      for (const agregadoId of data.agregados) {
        await query('INSERT INTO proveedor_agregados (proveedor_id, agregado_id) VALUES (?, ?)', [proveedorId, agregadoId]);
      }
    }

    emitSocketEvent('proveedores:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Proveedores', entidad_id: proveedorId,
      descripcion: `Creó el proveedor "${data.nombre}" (RIF: ${data.rif})`,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, plantas: data.plantas, agregados: data.agregados },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Proveedor registrado correctamente.', insertId: proveedorId }, { status: 201 });
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

    const anterior: any = await query('SELECT id, nombre, rif FROM proveedores WHERE id = ?', [id]);
    const old = anterior.length > 0 ? anterior[0] : null;

    const sql = `UPDATE proveedores SET nombre = ?, rif = ?, direccion = ?, clasificacion_gasto = ?, es_contribuyente_especial = ? WHERE id = ?`;
    const valores = [data.nombre, data.rif, data.direccion || null, data.clasificacionGasto || null, data.esContribuyenteEspecial ? 1 : 0, id];
    await query(sql, valores);

    // Reemplazar plantas
    await query('DELETE FROM proveedor_plantas WHERE proveedor_id = ?', [id]);
    if (Array.isArray(data.plantas) && data.plantas.length > 0) {
      for (const planta of data.plantas) {
        if (planta && planta.trim()) {
          await query('INSERT INTO proveedor_plantas (proveedor_id, nombre) VALUES (?, ?)', [id, planta.trim()]);
        }
      }
    }

    // Reemplazar agregados
    await query('DELETE FROM proveedor_agregados WHERE proveedor_id = ?', [id]);
    if (Array.isArray(data.agregados) && data.agregados.length > 0) {
      for (const agregadoId of data.agregados) {
        await query('INSERT INTO proveedor_agregados (proveedor_id, agregado_id) VALUES (?, ?)', [id, agregadoId]);
      }
    }

    emitSocketEvent('proveedores:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Proveedores', entidad_id: id,
      descripcion: `Editó el proveedor "${data.nombre}"`,
      datos_anteriores: old ? { nombre: old.nombre, rif: old.rif } : null,
      datos_nuevos: { nombre: data.nombre, rif: data.rif, plantas: data.plantas, agregados: data.agregados },
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

    await query('DELETE FROM proveedor_plantas WHERE proveedor_id = ?', [id]);
    await query('DELETE FROM proveedor_agregados WHERE proveedor_id = ?', [id]);
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
