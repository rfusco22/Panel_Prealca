'use client';

import { useEffect } from 'react';

/**
 * Hace que las tarjetas .indicador se inclinen HACIA el cursor, en vez de
 * siempre para el mismo lado. Sin esto la inclinación es fija y se nota que es
 * un truco; siguiendo al mouse parece que la tarjeta tiene volumen.
 *
 * Va montado una sola vez en el layout y escucha en el documento, así no hace
 * falta tocar cada tarjeta: cualquier .indicador que aparezca después (una
 * tabla que se recarga, un modal) queda con el efecto.
 *
 * Se apaga solo cuando el equipo pide menos animación o cuando no hay un mouse
 * de verdad (celular, tablet): ahí la inclinación no aporta y molesta.
 */
export function Efecto3D() {
  useEffect(() => {
    const sinMouse = window.matchMedia('(hover: none)').matches;
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sinMouse || menosMovimiento) return;

    // Cuánto se inclina como máximo, en grados. Más que esto deforma el texto.
    const MAX = 9;

    const mover = (e: PointerEvent) => {
      const objetivo = (e.target as HTMLElement | null)?.closest?.('.indicador') as HTMLElement | null;
      if (!objetivo) return;
      const caja = objetivo.getBoundingClientRect();
      // -0.5 a 0.5 desde el centro de la tarjeta.
      const x = (e.clientX - caja.left) / caja.width - 0.5;
      const y = (e.clientY - caja.top) / caja.height - 0.5;
      // El eje X se invierte: el mouse arriba tiene que hundir el borde de
      // arriba, no levantarlo.
      objetivo.style.setProperty('--rx', `${(-y * MAX).toFixed(2)}deg`);
      objetivo.style.setProperty('--ry', `${(x * MAX).toFixed(2)}deg`);
    };

    const salir = (e: PointerEvent) => {
      const objetivo = (e.target as HTMLElement | null)?.closest?.('.indicador') as HTMLElement | null;
      if (!objetivo) return;
      objetivo.style.removeProperty('--rx');
      objetivo.style.removeProperty('--ry');
    };

    document.addEventListener('pointermove', mover, { passive: true });
    document.addEventListener('pointerout', salir, { passive: true });
    return () => {
      document.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerout', salir);
    };
  }, []);

  return null;
}
