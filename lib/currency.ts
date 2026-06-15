import axios from 'axios';
import { db } from './db';
import { tasaCambio } from '@/schema';
import { sql } from 'drizzle-orm';

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'fxrate'; // Usar una API pública si no hay key

interface ExchangeRateResponse {
  rate: number;
  timestamp?: number;
}

export async function getExchangeRate(): Promise<number> {
  try {
    // Primero intentar obtener la tasa actual del día de la BD
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRate = await db.query.tasaCambio.findFirst({
      where: sql`DATE(fecha) = DATE(${today})`,
    });

    if (existingRate) {
      return parseFloat(existingRate.tasaBolivaresADolares.toString());
    }

    // Si no existe, obtener de una API pública
    let rate = 35.0; // Valor por defecto

    try {
      // Intentar con exchangerate-api.com (requiere API key)
      if (process.env.EXCHANGE_RATE_API_KEY) {
        const response = await axios.get(
          `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`,
          { timeout: 5000 }
        );
        rate = response.data.conversion_rates.VEF || 35.0;
      } else {
        // Alternativa: usar una API pública sin key
        const response = await axios.get(
          'https://open.er-api.com/v6/latest/USD',
          { timeout: 5000 }
        );
        rate = response.data.rates.VEF || 35.0;
      }
    } catch (apiError) {
      console.warn('[v0] Error fetching exchange rate from API, using default:', apiError);
    }

    // Guardar la tasa en la BD
    await db.insert(tasaCambio).values({
      fecha: new Date(),
      tasaBolivaresADolares: rate.toString(),
    }).catch(() => {
      // Ignorar si ya existe un registro para hoy
    });

    return rate;
  } catch (error) {
    console.error('[v0] Error getting exchange rate:', error);
    return 35.0; // Valor por defecto en caso de error
  }
}

export async function convertBolivaresToDollars(bolivares: number, rate?: number): Promise<number> {
  const exchangeRate = rate || await getExchangeRate();
  return bolivares / exchangeRate;
}

export async function convertDollarsToBolivares(dollars: number, rate?: number): Promise<number> {
  const exchangeRate = rate || await getExchangeRate();
  return dollars * exchangeRate;
}

export function calculateIVA(amount: number, percentage: number = 16): number {
  return (amount * percentage) / 100;
}

export function calculateRetention(ivaAmount: number, percentage: number = 75): number {
  return (ivaAmount * percentage) / 100;
}
