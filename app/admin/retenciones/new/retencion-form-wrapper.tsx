'use client';

import { useRouter } from 'next/navigation';
import { RetencionForm } from '@/components/forms/retencion-form';

// RetencionForm exige onClose (lo llama al guardar y al cancelar). La página es
// un server component y no puede pasar funciones, así que el handler vive acá:
// al cerrar, se vuelve al listado.
export function RetencionFormWrapper() {
  const router = useRouter();

  return (
    <RetencionForm
      onClose={() => {
        router.push('/admin/retenciones');
        router.refresh();
      }}
    />
  );
}
