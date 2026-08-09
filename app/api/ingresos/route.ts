import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { emitSocketEvent } from '@/lib/socket-server';
import { registrarLog, getUsuarioFromRequest, getClientIp } from '@/lib/audit-log';

export async function GET() {
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
  try {
    const body = await request.json();
    const { banco, nombreCliente, rif, vendedor, comision_porcentaje, comision_monto, descripcion, m3, resistencia, precioBs, precioDivisa, tasaCambio, aplicaIva, montoIva, tipoDocumento, referencia } = body;
    const aplicaIvaSql = aplicaIva ? 1 : 0;
    const sql = `INSERT INTO ingresos (banco, nombreCliente, rif, vendedor, comision_porcentaje, comision_monto, descripcion, m3, resistencia, precioBs, precioDivisa, tasaCambio, aplicaIva, montoIva, tipoDocumento, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [banco, nombreCliente, rif, vendedor, comision_porcentaje || null, comision_monto || null, descripcion || null, m3 ? parseFloat(m3) : null, resistencia || null, parseFloat(precioBs), parseFloat(precioDivisa), parseFloat(tasaCambio), aplicaIvaSql, montoIva ? parseFloat(montoIva) : null, tipoDocumento, referencia];
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
