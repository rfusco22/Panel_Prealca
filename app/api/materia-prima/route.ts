import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

async function ensureColumns() {
  try { await query(`ALTER TABLE materia_prima ADD COLUMN es_saldo_inicial TINYINT(1) DEFAULT 0`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN planta VARCHAR(255) NULL`); } catch {}
  // Ver sql/migracion_materia_prima_planta_chofer_unidad.sql
  try { await query(`ALTER TABLE materia_prima ADD COLUMN planta_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN chofer_id INT NULL`); } catch {}
  try { await query(`ALTER TABLE materia_prima ADD COLUMN unidad_id INT NULL`); } catch {}
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const sql = `
      SELECT mp.*, a.nombre AS agregado_nombre, a.unidad_medida,
             pv.nombre AS proveedor_nombre, pv.planta AS proveedor_planta,
             pl.nombre AS planta_nombre,
             ch.nombre AS chofer_nombre,
             un.numero_unidad AS unidad_numero, un.placa AS unidad_placa
      FROM materia_prima mp
      JOIN agregados a ON mp.agregado_id = a.id
      LEFT JOIN proveedores pv ON mp.proveedor_id = pv.id
      LEFT JOIN proveedor_plantas pl ON mp.planta_id = pl.id
      LEFT JOIN choferes ch ON mp.chofer_id = ch.id
      LEFT JOIN unidades un ON mp.unidad_id = un.id
      ORDER BY mp.id DESC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, materiaPrima: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo materia prima:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const data = await req.json();

    const proveedorId = data.proveedor_id ? Number(data.proveedor_id) : null;
    const plantaId = data.planta_id ? Number(data.planta_id) : null;
    const choferId = data.chofer_id ? Number(data.chofer_id) : null;
    const unidadId = data.unidad_id ? Number(data.unidad_id) : null;

    // La planta tiene que pertenecer al proveedor elegido: el id viaja desde el
    // navegador y no se puede confiar en que corresponda.
    if (plantaId !== null) {
      const plantas: any = await query(
        'SELECT id FROM proveedor_plantas WHERE id = ? AND proveedor_id = ?',
        [plantaId, proveedorId]
      );
      if (plantas.length === 0) {
        return NextResponse.json(
          { error: 'La planta seleccionada no pertenece al proveedor.' },
          { status: 400 }
        );
      }
    }

    const sql = `INSERT INTO materia_prima (agregado_id, cantidad, unidad, fecha, proveedor_id, planta_id, chofer_id, unidad_id, es_saldo_inicial, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [
      data.agregado_id,
      parseFloat(data.cantidad),
      data.unidad || 'M3',
      data.fecha,
      proveedorId,
      plantaId,
      choferId,
      unidadId,
      data.es_saldo_inicial ? 1 : 0,
      // Sale de la sesión, no del cuerpo del request: antes el cliente mandaba
      // usuario_id: 1 fijo y todos los registros quedaban a nombre del usuario 1.
      auth.session.userId,
    ];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('materia-prima:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Materia Prima', entidad_id: resultado.insertId,
      descripcion: `Registró materia prima: ${data.cantidad} ${data.unidad || 'M3'}`,
      datos_nuevos: { agregado_id: data.agregado_id, cantidad: data.cantidad, unidad: data.unidad, proveedor_id: proveedorId, planta_id: plantaId, chofer_id: choferId, unidad_id: unidadId, es_saldo_inicial: data.es_saldo_inicial },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Materia prima registrada correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando materia prima:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

// Editar y eliminar son solo para admin: estos registros alimentan el cálculo
// de stock, así que corregirlos mueve las existencias de todo el sistema.
export async function PUT(req: Request) {
  const auth = await requireAuth(['admin']);
  if (auth.response) return auth.response;

  try {
    await ensureColumns();
    const data = await req.json();

    const id = data.id ? Number(data.id) : null;
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    }

    const anteriores: any = await query(
      `SELECT id, agregado_id, cantidad, unidad, fecha, proveedor_id, planta_id, chofer_id, unidad_id, es_saldo_inicial
       FROM materia_prima WHERE id = ?`,
      [id]
    );
    if (anteriores.length === 0) {
      return NextResponse.json({ error: 'El registro no existe.' }, { status: 404 });
    }
    const anterior = anteriores[0];

    const proveedorId = data.proveedor_id ? Number(data.proveedor_id) : null;
    const plantaId = data.planta_id ? Number(data.planta_id) : null;
    const choferId = data.chofer_id ? Number(data.chofer_id) : null;
    const unidadId = data.unidad_id ? Number(data.unidad_id) : null;

    // Misma validación que en el alta: el id de planta viene del navegador.
    if (plantaId !== null) {
      const plantas: any = await query(
        'SELECT id FROM proveedor_plantas WHERE id = ? AND proveedor_id = ?',
        [plantaId, proveedorId]
      );
      if (plantas.length === 0) {
        return NextResponse.json(
          { error: 'La planta seleccionada no pertenece al proveedor.' },
          { status: 400 }
        );
      }
    }

    await query(
      `UPDATE materia_prima
       SET agregado_id = ?, cantidad = ?, unidad = ?, fecha = ?, proveedor_id = ?,
           planta_id = ?, chofer_id = ?, unidad_id = ?, es_saldo_inicial = ?
       WHERE id = ?`,
      [
        data.agregado_id,
        parseFloat(data.cantidad),
        data.unidad || 'M3',
        data.fecha,
        proveedorId,
        plantaId,
        choferId,
        unidadId,
        data.es_saldo_inicial ? 1 : 0,
        id,
      ]
    );
    emitSocketEvent('materia-prima:updated');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'editar', modulo: 'Materia Prima', entidad_id: id,
      descripcion: `Editó materia prima: ${data.cantidad} ${data.unidad || 'M3'}`,
      datos_anteriores: {
        agregado_id: anterior.agregado_id, cantidad: anterior.cantidad, unidad: anterior.unidad,
        fecha: anterior.fecha, proveedor_id: anterior.proveedor_id, planta_id: anterior.planta_id,
        chofer_id: anterior.chofer_id, unidad_id: anterior.unidad_id, es_saldo_inicial: anterior.es_saldo_inicial,
      },
      datos_nuevos: {
        agregado_id: data.agregado_id, cantidad: data.cantidad, unidad: data.unidad,
        fecha: data.fecha, proveedor_id: proveedorId, planta_id: plantaId,
        chofer_id: choferId, unidad_id: unidadId, es_saldo_inicial: data.es_saldo_inicial,
      },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Registro actualizado correctamente.' });
  } catch (error: any) {
    console.error("Error actualizando materia prima:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(['admin']);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido.' }, { status: 400 });
    }

    const anteriores: any = await query(
      `SELECT mp.id, mp.cantidad, mp.unidad, mp.fecha, mp.agregado_id, a.nombre AS agregado_nombre
       FROM materia_prima mp
       LEFT JOIN agregados a ON mp.agregado_id = a.id
       WHERE mp.id = ?`,
      [id]
    );
    if (anteriores.length === 0) {
      return NextResponse.json({ error: 'El registro no existe.' }, { status: 404 });
    }
    const anterior = anteriores[0];

    await query('DELETE FROM materia_prima WHERE id = ?', [id]);
    emitSocketEvent('materia-prima:deleted');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'eliminar', modulo: 'Materia Prima', entidad_id: Number(id),
      descripcion: `Eliminó materia prima: ${anterior.cantidad} ${anterior.unidad} de ${anterior.agregado_nombre || 'agregado'}`,
      datos_anteriores: {
        cantidad: anterior.cantidad, unidad: anterior.unidad,
        fecha: anterior.fecha, agregado_id: anterior.agregado_id,
      },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Registro eliminado correctamente.' });
  } catch (error: any) {
    console.error("Error eliminando materia prima:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
