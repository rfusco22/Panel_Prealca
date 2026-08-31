import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `SELECT * FROM ingresos ORDER BY id DESC`;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, data: resultados });
  } catch (error: any) {
    console.error("Error al obtener los ingresos:", error);
    return NextResponse.json({ success: false, error: "Error interno al cargar los datos desde MySQL." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { banco, nombreCliente, rif, vendedor, comision_porcentaje, comision_monto, descripcion, m3, resistencia, tasaCambio, aplicaIva, tipoDocumento, referencia } = body;

    // precioBs (cuánto entró realmente al banco) y tasaCambio son hechos que
    // trae quien registra el ingreso: no hay forma de que el servidor los
    // "sepa" de antemano. Lo que el servidor SÍ recalcula es todo lo que se
    // deriva de esos dos por aritmética pura (montoIva, precioDivisa), en vez
    // de confiar en los valores que mandaba el cliente: antes se podía enviar
    // un precioBs y un montoIva sin ninguna relación entre sí.
    const precioBs = parseFloat(body.precioBs);
    const tasaCambioNum = parseFloat(tasaCambio);
    if (!Number.isFinite(precioBs) || precioBs < 0) {
      return NextResponse.json({ success: false, error: 'precioBs inválido.' }, { status: 400 });
    }
    if (!Number.isFinite(tasaCambioNum) || tasaCambioNum <= 0) {
      return NextResponse.json({ success: false, error: 'tasaCambio inválida.' }, { status: 400 });
    }
    const aplicaIvaSql = aplicaIva ? 1 : 0;
    const montoIva = aplicaIva ? precioBs * 0.16 : 0;
    const precioDivisa = (precioBs + montoIva) / tasaCambioNum;

    const sql = `INSERT INTO ingresos (banco, nombreCliente, rif, vendedor, comision_porcentaje, comision_monto, descripcion, m3, resistencia, precioBs, precioDivisa, tasaCambio, aplicaIva, montoIva, tipoDocumento, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [banco, nombreCliente, rif, vendedor, comision_porcentaje || null, comision_monto || null, descripcion || null, m3 ? parseFloat(m3) : null, resistencia || null, precioBs, precioDivisa, tasaCambioNum, aplicaIvaSql, montoIva || null, tipoDocumento, referencia];
    await query(sql, values);
    emitSocketEvent('ingresos:created');

    const usuario = await getUsuarioFromRequest();
    await registrarLog({
      ...usuario, accion: 'crear', modulo: 'Ingresos', entidad_id: null,
      descripcion: `Registró ingreso: ${nombreCliente} - Bs. ${precioBs}`,
      datos_nuevos: { banco, nombreCliente, rif, precioBs, precioDivisa, tipoDocumento, referencia },
      ip_address: getClientIp(request),
    });

    return NextResponse.json({ success: true, mensaje: "Ingreso guardado exitosamente en la base de datos." });
  } catch (error: any) {
    console.error("Error al insertar en MySQL:", error);
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ success: false, error: "Esta referencia bancaria ya fue registrada anteriormente." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Error interno al guardar en la base de datos." }, { status: 500 });
  }
}
