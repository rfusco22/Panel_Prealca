import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `
      SELECT 
        id, nombre, cedula,
        rif, rif_vencimiento,
        licencia_documento, licencia_vencimiento,
        certificado_documento, certificado_vencimiento
      FROM choferes
      WHERE estado = 'activo'
        AND (
          (licencia_vencimiento IS NOT NULL AND licencia_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
          OR (certificado_vencimiento IS NOT NULL AND certificado_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
          OR (rif_vencimiento IS NOT NULL AND rif_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
        )
      ORDER BY 
        LEAST(
          COALESCE(licencia_vencimiento, '9999-12-31'),
          COALESCE(certificado_vencimiento, '9999-12-31'),
          COALESCE(rif_vencimiento, '9999-12-31')
        ) ASC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, alertas: resultados }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo alertas de choferes:", error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
