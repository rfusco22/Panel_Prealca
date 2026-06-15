import { GuiaDespachoForm } from '@/components/forms/guia-despacho-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Nueva Guía de Despacho - PREALCA',
};

export default function NewGuiaDespachoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/documentador/guia-despacho">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Guía de Despacho</h1>
      </div>

      <div className="max-w-2xl">
        <GuiaDespachoForm />
      </div>
    </div>
  );
}
