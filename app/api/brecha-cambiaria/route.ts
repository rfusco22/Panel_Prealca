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

async function fetchBinanceP2P(fiat: string = 'VES', tradeType: string = 'BUY'): Promise<number> {
  try {
    const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fiat,
        page: 1,
        rows: 1,
        tradeType,
        asset: 'USDT',
        countries: [],
        proMerchantAds: false,
        shieldMerchantAds: false,
        publisherType: null,
      }),
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Binance P2P error');
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return Number(data.data[0].adv.price) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

async function fetchBinanceUSDT(): Promise<Tasa | null> {
  try {
    const [precioCompra, precioVenta] = await Promise.all([
      fetchBinanceP2P('VES', 'BUY'),
      fetchBinanceP2P('VES', 'SELL'),
    ]);

    if (precioCompra === 0 && precioVenta === 0) return null;

    const promedio = precioCompra > 0 && precioVenta > 0
      ? (precioCompra + precioVenta) / 2
      : precioCompra || precioVenta;

    return {
      moneda: 'USDT',
      nombre: 'USDT Binance',
      compra: Math.round(precioCompra * 100) / 100,
      venta: Math.round(precioVenta * 100) / 100,
      promedio: Math.round(promedio * 100) / 100,
      fuente: 'Binance P2P',
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
