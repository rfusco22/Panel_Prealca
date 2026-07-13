import { NextResponse } from 'next/server';
// 1. Cambiamos la importación para traer tu función específica 'query'
import { query } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      banco,
      nombreCliente,
      rif,
      vendedor,
      comision_porcentaje,
      comision_monto,
      descripcion,
      m3,
      resistencia,
      precioBs,
      precioDivisa,
      tasaCambio,
      aplicaIva,
      montoIva,
      tipoDocumento,
      referencia
    } = body;

    const aplicaIvaSql = aplicaIva ? 1 : 0;
    
    // Asegúrate de que el nombre de la tabla coincida. Por tu imagen anterior, asumo que se llama 'ingresos'
    const sql = `
      INSERT INTO ingresos (
        banco, 
        nombreCliente, 
        rif, 
        vendedor, 
        comision_porcentaje, 
        comision_monto, 
        descripcion, 
        m3, 
        resistencia, 
        precioBs, 
        precioDivisa, 
        tasaCambio, 
        aplicaIva, 
        montoIva, 
        tipoDocumento, 
        referencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      banco,
      nombreCliente,
      rif,
      vendedor,
      comision_porcentaje || null,
      comision_monto || null,
      descripcion || null,
      m3 ? parseFloat(m3) : null,
      resistencia || null,
      parseFloat(precioBs),
      parseFloat(precioDivisa),
      parseFloat(tasaCambio),
      aplicaIvaSql,
      montoIva ? parseFloat(montoIva) : null,
      tipoDocumento, 
      referencia
    ];

    // 2. Ejecutamos usando tu función, pasándole el string SQL y el array de valores
    await query(sql, values);

    return NextResponse.json({ 
      success: true, 
      mensaje: "Ingreso guardado exitosamente en la base de datos." 
    });

  } catch (error: any) {
    console.error("Error al insertar en MySQL:", error);

    // Detección de referencia duplicada (Si alguien intenta meter el mismo comprobante 2 veces)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        success: false, 
        error: "Esta referencia bancaria ya fue registrada anteriormente." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Error interno al guardar en la base de datos." 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Consultamos todos los ingresos, ordenados por el más reciente (id descendente)
    const sql = `SELECT * FROM ingresos ORDER BY id DESC`;
    
    // Usamos tu función query
    const resultados = await query(sql);

    // Devolvemos los datos al frontend (tu tabla)
    return NextResponse.json({ 
      success: true, 
      data: resultados // Ajusta el nombre 'data' si tu tabla espera otra variable (ej. 'ingresos': resultados)
    });

  } catch (error: any) {
    console.error("Error al obtener los ingresos:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error interno al cargar los datos desde MySQL." 
    }, { status: 500 });
  }
}