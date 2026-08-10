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
    return { moneda: 'USD', nombre: 'Dólar BCV', compra: 0, venta: 0, promedio: 0, fuente: 'BCV Oficial', fecha: '' };
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
    return { moneda: 'EUR', nombre: 'Euro BCV', compra: 0, venta: 0, promedio: 0, fuente: 'BCV Oficial', fecha: '' };
  }
}

async function fetchBinanceUSDT(): Promise<Tasa | null> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTVEF', { cache: 'no-store' });
    if (!res.ok) {
      const res2 = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTVES', { cache: 'no-store' });
      if (!res2.ok) throw new Error('Binance API error');
      const data2 = await res2.json();
      const precio = Number(data2.price) || 0;
      return {
        moneda: 'USDT',
        nombre: 'USDT Binance',
        compra: precio,
        venta: precio,
        promedio: precio,
        fuente: 'Binance P2P',
        fecha: new Date().toISOString(),
      };
    }
    const data = await res.json();
    const precio = Number(data.price) || 0;
    return {
      moneda: 'USDT',
      nombre: 'USDT Binance',
      compra: precio,
      venta: precio,
      promedio: precio,
      fuente: 'Binance P2P',
      fecha: new Date().toISOString(),
    };
  } catch {
    return { moneda: 'USDT', nombre: 'USDT Binance', compra: 0, venta: 0, promedio: 0, fuente: 'Binance P2P', fecha: '' };
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
