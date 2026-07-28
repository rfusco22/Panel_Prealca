import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Materia prima disponible por agregado (entradas - salidas por fórmula)
    const materiaPrimaDisponible: any = await query(`
      SELECT 
        a.id AS agregadoId,
        a.nombre AS agregadoNombre,
        a.unidad_medida AS unidadMedida,
        COALESCE(SUM(mp.cantidad), 0) AS totalEntradas,
        COALESCE((
          SELECT SUM(gd.cantidad_m3 * pf.cantidad)
          FROM guia_despacho gd
          INNER JOIN producto_formulas pf ON pf.producto_id = gd.producto_id
          WHERE pf.agregado_id = a.id
        ), 0) AS totalConsumido,
        COALESCE(SUM(mp.cantidad), 0) - COALESCE((
          SELECT SUM(gd.cantidad_m3 * pf.cantidad)
          FROM guia_despacho gd
          INNER JOIN producto_formulas pf ON pf.producto_id = gd.producto_id
          WHERE pf.agregado_id = a.id
        ), 0) AS disponible
      FROM agregados a
      LEFT JOIN materia_prima mp ON mp.agregado_id = a.id
      GROUP BY a.id, a.nombre, a.unidad_medida
      ORDER BY a.nombre
    `);

    // 2. Stock disponible por producto (usando fórmula)
    const stockProductos: any = await query(`
      SELECT 
        p.id AS productoId,
        CONCAT(p.resistencia, ' - ', p.pulgada) AS productoNombre,
        p.resistencia,
        p.pulgada,
        p.unidad,
        (
          SELECT MIN(
            CASE 
              WHEN pf.cantidad = 0 THEN 999999999
              ELSE (
                COALESCE(
                  (SELECT SUM(mp.cantidad) FROM materia_prima mp WHERE mp.agregado_id = pf.agregado_id), 0
                ) - COALESCE(
                  (SELECT SUM(gd.cantidad_m3 * pf2.cantidad) 
                   FROM guia_despacho gd 
                   INNER JOIN producto_formulas pf2 ON pf2.producto_id = gd.producto_id 
                   WHERE pf2.agregado_id = pf.agregado_id), 0
                )
              ) / pf.cantidad
            END
          )
          FROM producto_formulas pf
          WHERE pf.producto_id = p.id
        ) AS stockDisponible,
        (
          SELECT COALESCE(SUM(gd.cantidad_m3), 0)
          FROM guia_despacho gd
          WHERE gd.producto_id = p.id
        ) AS totalDespachado,
        (
          SELECT COUNT(*)
          FROM producto_formulas pf
          WHERE pf.producto_id = p.id
        ) AS totalAgregados
      FROM productos p
      ORDER BY p.resistencia, p.pulgada
    `);

    // 3. Detalle de fórmula por producto (para mostrar composición)
    const formulasDetalle: any = await query(`
      SELECT 
        pf.producto_id AS productoId,
        a.nombre AS agregadoNombre,
        pf.cantidad AS cantidadRequerida,
        a.unidad_medida AS unidadMedida,
        COALESCE(
          (SELECT SUM(mp.cantidad) FROM materia_prima mp WHERE mp.agregado_id = pf.agregado_id), 0
        ) AS disponibleAgregado,
        COALESCE(
          (SELECT SUM(gd.cantidad_m3 * pf2.cantidad) 
           FROM guia_despacho gd 
           INNER JOIN producto_formulas pf2 ON pf2.producto_id = gd.producto_id 
           WHERE pf2.agregado_id = pf.agregado_id), 0
        ) AS consumidoAgregado
      FROM producto_formulas pf
      INNER JOIN agregados a ON pf.agregado_id = a.id
      ORDER BY pf.producto_id, a.nombre
    `);

    // Agrupar formulas por producto
    const formulasPorProducto: Record<number, any[]> = {};
    for (const row of formulasDetalle) {
      if (!formulasPorProducto[row.productoId]) {
        formulasPorProducto[row.productoId] = [];
      }
      formulasPorProducto[row.productoId].push({
        agregadoNombre: row.agregadoNombre,
        cantidadRequerida: parseFloat(row.cantidadRequerida),
        unidadMedida: row.unidadMedida,
        disponible: parseFloat(row.disponibleAgregado) - parseFloat(row.consumidoAgregado),
      });
    }

    // Agregar formulas a cada producto
    for (const prod of stockProductos) {
      prod.formula = formulasPorProducto[prod.productoId] || [];
      prod.stockDisponible = prod.stockDisponible !== null ? parseFloat(prod.stockDisponible) : 0;
      prod.totalDespachado = parseFloat(prod.totalDespachado);
    }

    return NextResponse.json({
      success: true,
      materiaPrima: materiaPrimaDisponible,
      productos: stockProductos,
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculando stock:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
