import { FacturaForm } from '@/components/forms/factura-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Nueva Factura - PREALCA',
};

export default function NewFacturaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/registro/facturas">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Factura</h1>
      </div>

      <div className="max-w-2xl">
        <FacturaForm />
      </div>
    </div>
  );
}
