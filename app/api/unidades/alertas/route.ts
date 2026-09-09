import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const sql = `
      SELECT
        id, numero_unidad AS numeroUnidad, placa,
        poliza_rcv_vencimiento AS polizaRcvVencimiento,
        rot_vencimiento AS rotVencimiento,
        proximo_mantenimiento AS proximoMantenimiento
      FROM unidades
      WHERE
        (poliza_rcv_vencimiento IS NOT NULL AND poliza_rcv_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
        OR (rot_vencimiento IS NOT NULL AND rot_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
        OR (proximo_mantenimiento IS NOT NULL AND proximo_mantenimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      ORDER BY
        LEAST(
          COALESCE(poliza_rcv_vencimiento, '9999-12-31'),
          COALESCE(rot_vencimiento, '9999-12-31'),
          COALESCE(proximo_mantenimiento, '9999-12-31')
        ) ASC
    `;
    const resultados = await query(sql);
    return NextResponse.json({ success: true, alertas: resultados }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo alertas de unidades:', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
