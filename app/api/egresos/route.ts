import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';
import { hoyLocal } from '@/lib/fecha';
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `SELECT * FROM egresos ORDER BY id DESC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, egresos: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo egresos:", error);
    return NextResponse.json({ error: 'Error interno al cargar los egresos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const data = await req.json();
    const rif = data.prefijoRif && data.numeroRif ? `${data.prefijoRif}-${data.numeroRif}` : data.rif || '';
    let detalleExtra = null;
    if (data.detalleExtra) {
      detalleExtra = data.detalleExtra;
    }
    if (data.cantidadProduccion && data.precioUnitario) {
      const cantidad = parseFloat(data.cantidadProduccion);
      const precioUnitario = parseFloat(data.precioUnitario);
      // subtotal recalculado, no el que mandaba el cliente: antes podía no
      // coincidir con cantidad * precioUnitario.
      const extra = { cantidad, precioUnitario, subtotal: cantidad * precioUnitario };
      detalleExtra = JSON.stringify(extra);
    }

    // montoBs (cuánto salió realmente del banco) y tasaCambio son hechos que
    // trae quien registra el egreso. montoDivisa se recalcula a partir de esos
    // dos en vez de confiar en el valor que mandaba el cliente.
    const montoBs = parseFloat(data.montoBs);
    const tasaCambioNum = parseFloat(data.tasaCambio);
    if (!Number.isFinite(montoBs) || montoBs < 0) {
      return NextResponse.json({ error: 'montoBs inválido.' }, { status: 400 });
    }
    if (!Number.isFinite(tasaCambioNum) || tasaCambioNum <= 0) {
      return NextResponse.json({ error: 'tasaCambio inválida.' }, { status: 400 });
    }
    const montoDivisa = montoBs / tasaCambioNum;

    const sql = `INSERT INTO egresos (banco, nombreProveedor, rif, clasificacionGasto, subCategoria, detalleExtra, descripcion, montoBs, montoDivisa, tasaCambio, referencia, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const fechaEgreso = data.fecha ? data.fecha : hoyLocal();
    const valores = [data.banco, data.nombreProveedor, rif, data.clasificacionGasto, data.subCategoria || null, detalleExtra, data.descripcion || null, montoBs, montoDivisa, tasaCambioNum, data.referencia, fechaEgreso];
    const resultado: any = await query(sql, valores);
    emitSocketEvent('egresos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Egresos', entidad_id: resultado.insertId,
      descripcion: `Registró egreso: ${data.nombreProveedor} - Bs. ${data.montoBs}`,
      datos_nuevos: { banco: data.banco, nombreProveedor: data.nombreProveedor, rif, montoBs: data.montoBs, referencia: data.referencia },
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ success: true, mensaje: 'Egreso registrado correctamente.', insertId: resultado.insertId }, { status: 201 });
  } catch (error: any) {
    console.error("Error registrando egreso:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: 'La referencia de este egreso ya está registrada.' }, { status: 409 });
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
