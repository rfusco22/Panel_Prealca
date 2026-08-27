import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth(['admin', 'gerencia']);
  if (auth.response) return auth.response;

  try {
    // 1. Choferes - documentos vencidos o próximos a vencer (7 días)
    const choferesRaw: any = await query(`
      SELECT id, nombre, cedula, rif, rif_vencimiento,
        licencia_documento, licencia_vencimiento,
        certificado_documento, certificado_vencimiento
      FROM choferes
      WHERE estado = 'activo'
        AND (
          (licencia_vencimiento IS NOT NULL AND licencia_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (certificado_vencimiento IS NOT NULL AND certificado_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
          OR (rif_vencimiento IS NOT NULL AND rif_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY))
        )
      ORDER BY LEAST(
        COALESCE(licencia_vencimiento, '9999-12-31'),
        COALESCE(certificado_vencimiento, '9999-12-31'),
        COALESCE(rif_vencimiento, '9999-12-31')
      ) ASC
    `);

    const choferes = [];
    for (const c of choferesRaw) {
      const ahora = new Date();
      const docs = [
        { nombre: 'Licencia', fecha: c.licencia_vencimiento },
        { nombre: 'Cert. Médico', fecha: c.certificado_vencimiento },
        { nombre: 'RIF', fecha: c.rif_vencimiento },
      ];
      for (const doc of docs) {
        if (!doc.fecha) continue;
        const d = new Date(doc.fecha);
        const diff = Math.ceil((d.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
          choferes.push({ chofer: c.nombre, cedula: c.cedula, documento: doc.nombre, fecha: doc.fecha, dias: diff, tipo: 'vencido' });
        } else if (diff <= 30) {
          choferes.push({ chofer: c.nombre, cedula: c.cedula, documento: doc.nombre, fecha: doc.fecha, dias: diff, tipo: diff <= 7 ? 'urgente' : 'proximo' });
        }
      }
    }

    // 2. Materia Prima - stock bajo o agotado
    const stockRaw: any = await query(`
      SELECT 
        a.id, a.nombre, a.unidad_medida AS unidad,
        COALESCE(SUM(mp.cantidad), 0) AS entradas,
        COALESCE((
          SELECT SUM(gd.cantidad_m3 * pf.cantidad)
          FROM guia_despacho gd
          INNER JOIN producto_formulas pf ON pf.producto_id = gd.producto_id
          WHERE pf.agregado_id = a.id
        ), 0) AS consumido,
        COALESCE(SUM(mp.cantidad), 0) - COALESCE((
          SELECT SUM(gd.cantidad_m3 * pf.cantidad)
          FROM guia_despacho gd
          INNER JOIN producto_formulas pf ON pf.producto_id = gd.producto_id
          WHERE pf.agregado_id = a.id
        ), 0) AS disponible
      FROM agregados a
      LEFT JOIN materia_prima mp ON mp.agregado_id = a.id
      GROUP BY a.id, a.nombre, a.unidad_medida
      HAVING disponible <= 0
      ORDER BY disponible ASC
    `);
    const materiaPrima = stockRaw.map((r: any) => ({
      nombre: r.nombre,
      unidad: r.unidad,
      disponible: Number(r.disponible),
      entradas: Number(r.entradas),
      consumido: Number(r.consumido),
    }));

    // 3. Producción Baja - productos con producción < 200 M3 en últimos 30 días
    const produccionRaw: any = await query(`
      SELECT 
        p.id, CONCAT(p.resistencia, ' - ', p.pulgada) AS nombre, p.unidad,
        COALESCE(SUM(gd.cantidad_m3), 0) AS totalDespachado,
        COUNT(gd.id) AS totalGuias
      FROM productos p
      LEFT JOIN guia_despacho gd ON p.id = gd.producto_id AND gd.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.resistencia, p.pulgada, p.unidad
      HAVING totalDespachado < 200
      ORDER BY totalDespachado ASC
    `);
    const produccion = produccionRaw.map((r: any) => ({
      nombre: r.nombre,
      unidad: r.unidad,
      despachado: Number(r.totalDespachado),
      guias: Number(r.totalGuias),
    }));

    // 4. Pedidos Pendientes / En Proceso por más de 3 días
    const pedidosRaw: any = await query(`
      SELECT 
        pe.id, c.nombre AS cliente, CONCAT(pr.resistencia, ' - ', pr.pulgada) AS producto,
        pe.cantidad_m3 AS cantidadM3, pe.estado, pe.created_at AS fecha,
        DATEDIFF(NOW(), pe.created_at) AS dias
      FROM pedidos pe
      LEFT JOIN clientes c ON pe.cliente_id = c.id
      LEFT JOIN productos pr ON pe.producto_id = pr.id
      WHERE pe.estado IN ('pendiente', 'en_proceso')
        AND pe.created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)
      ORDER BY pe.created_at ASC
    `);
    const pedidos = pedidosRaw.map((r: any) => ({
      id: r.id,
      cliente: r.cliente,
      producto: r.producto,
      cantidadM3: Number(r.cantidadM3),
      estado: r.estado,
      fecha: r.fecha,
      dias: Number(r.dias),
    }));

    // 5. Unidades con documentos próximos a vencer (SOAT, revision, etc.) - placeholder
    const unidadesRaw: any = await query(`
      SELECT id, numero_unidad AS numeroUnidad, placa, marca, modelo
      FROM unidades
      ORDER BY id DESC
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      choferes,
      materiaPrima,
      produccion,
      pedidos,
      unidades: unidadesRaw,
    }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo alertas generales:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
