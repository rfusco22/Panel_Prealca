import { NextResponse } from 'next/server';

interface Tasa {
  moneda: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fuente: string;
  fecha: string;
}

async function fetchBCVDolar(): Promise<Tasa | null> {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
    if (!res.ok) throw new Error('BCV API error');
    const data = await res.json();
    return {
      moneda: 'USD',
      nombre: 'Dólar BCV',
      compra: Number(data.compra) || 0,
      venta: Number(data.venta) || 0,
      promedio: Number(data.promedio) || 0,
      fuente: 'BCV Oficial',
      fecha: data.fechaActualizacion || data.fecha_actualizacion || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchBCVEuro(): Promise<Tasa | null> {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/euros', { cache: 'no-store' });
    if (!res.ok) throw new Error('BCV Euro API error');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const euro = data[0];
      return {
        moneda: 'EUR',
        nombre: 'Euro BCV',
        compra: Number(euro.compra) || 0,
        venta: Number(euro.venta) || 0,
        promedio: Number(euro.promedio) || ((Number(euro.compra) + Number(euro.venta)) / 2),
        fuente: 'BCV Oficial',
        fecha: euro.fechaActualizacion || euro.fecha_actualizacion || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchBinanceUSDT(): Promise<Tasa | null> {
  try {
    // Obtener precio de USDT en USD desde Binance
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDCUSDT', { cache: 'no-store' });
    if (!res.ok) throw new Error('Binance USDC/USDT error');
    const data = await res.json();
    const usdtEnUsd = Number(data.price) || 1;

    // Obtener tasa paralela de dólar (dólar paralelo suele ser ~10-15% más alto que BCV)
    // Usamos dolarapi para obtener el dólar paralelo
    let tasaParalela = 0;
    try {
      const resParalelo = await fetch('https://ve.dolarapi.com/v1/dolares', { cache: 'no-store' });
      if (resParalelo.ok) {
        const dataParalelo = await resParalelo.json();
        if (Array.isArray(dataParalelo)) {
          // Buscar dólar paralelo (no oficial)
          const paralelo = dataParalelo.find((d: any) => d.nombre?.toLowerCase().includes('paralelo') || d.fuente?.toLowerCase().includes('paralelo'));
          if (paralelo) {
            tasaParalela = Number(paralelo.promedio) || Number(paralelo.venta) || 0;
          }
          // Si no hay paralelo, usar el más alto disponible
          if (!tasaParalela && dataParalelo.length > 0) {
            const mayor = dataParalelo.reduce((max: any, d: any) => (Number(d.promedio) || 0) > (Number(max.promedio) || 0) ? d : max, dataParalelo[0]);
            tasaParalela = Number(mayor.promedio) || Number(mayor.venta) || 0;
          }
        }
      }
    } catch {}

    // Si no hay tasa paralela, usar la oficial
    if (!tasaParalela) {
      const resOficial = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (resOficial.ok) {
        const dataOficial = await resOficial.json();
        tasaParalela = Number(dataOficial.promedio) || Number(dataOficial.venta) || 0;
      }
    }

    if (!tasaParalela) return null;

    // USDT/VES = USDT/USD * USD/VES(paralelo)
    const precioUSDT = usdtEnUsd * tasaParalela;

    return {
      moneda: 'USDT',
      nombre: 'USDT Binance',
      compra: Math.round(precioUSDT * 100) / 100,
      venta: Math.round(precioUSDT * 100) / 100,
      promedio: Math.round(precioUSDT * 100) / 100,
      fuente: 'Binance + Paralelo',
      fecha: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [dolar, euro, usdt] = await Promise.all([
      fetchBCVDolar(),
      fetchBCVEuro(),
      fetchBinanceUSDT(),
    ]);

    const tasas = [dolar, euro, usdt].filter((t): t is Tasa => t !== null && t.promedio > 0);

    const promedios = tasas.map(t => t.promedio).filter(p => p > 0);

    let brechaPorcentaje = 0;
    let brechaMonto = 0;
    let tasaMayor = 0;
    let tasaMenor = 0;
    let monedaMayor = '';
    let monedaMenor = '';

    if (promedios.length >= 2) {
      tasaMayor = Math.max(...promedios);
      tasaMenor = Math.min(...promedios);
      brechaPorcentaje = ((tasaMayor - tasaMenor) / tasaMenor) * 100;
      brechaMonto = tasaMayor - tasaMenor;
      const mayor = tasas.find(t => t.promedio === tasaMayor);
      const menor = tasas.find(t => t.promedio === tasaMenor);
      monedaMayor = mayor?.nombre || '';
      monedaMenor = menor?.nombre || '';
    }

    return NextResponse.json({
      success: true,
      tasas,
      brecha: {
        porcentaje: Math.round(brechaPorcentaje * 100) / 100,
        monto: Math.round(brechaMonto * 100) / 100,
        tasaMayor,
        tasaMenor,
        monedaMayor,
        monedaMenor,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo brecha cambiaria:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
