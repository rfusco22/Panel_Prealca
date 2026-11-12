'use client';

import { useRouter, usePathname } from 'next/navigation';
import { RetencionForm } from '@/components/forms/retencion-form';

// RetencionForm exige onClose (lo llama al guardar y al cancelar). La página es
// un server component y no puede pasar funciones, así que el handler vive acá:
// al cerrar, se vuelve al listado del panel actual (/admin o /gerencia).
export function RetencionFormWrapper() {
  const router = useRouter();
  const listadoHref = usePathname().replace(/\/new\/?$/, '');

  return (
    <RetencionForm
      onClose={() => {
        router.push(listadoHref);
        router.refresh();
      }}
    />
  );
}
