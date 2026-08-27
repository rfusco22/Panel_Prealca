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
