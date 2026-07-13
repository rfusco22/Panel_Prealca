import { Metadata } from "next";
import EgresoForm from "@/components/forms/egreso-form";
import EgresosTable from "@/components/tables/egresos-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Módulo de Egresos | Panel Prealca",
  description: "Gestión y registro de gastos operativos y pagos a proveedores",
};

export default function EgresosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">
          Módulo de Egresos y Gastos
        </h2>
      </div>

      <Tabs defaultValue="registro" className="space-y-4">
        <TabsList className="bg-gray-100/50 p-1 rounded-lg">
          <TabsTrigger value="registro" className="text-base">
            Registrar Nuevo Egreso
          </TabsTrigger>
          <TabsTrigger value="historial" className="text-base">
            Historial de Egresos
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña del Formulario */}
        <TabsContent value="registro" className="space-y-4 outline-none">
          <div className="py-4">
            <EgresoForm />
          </div>
        </TabsContent>

        {/* Pestaña de la Tabla/Historial */}
        <TabsContent value="historial" className="space-y-4 outline-none">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Egresos Registrados</h3>
            {/* Aquí va tu componente de tabla, que idealmente hace un fetch a un GET de /api/egresos */}
            <EgresosTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}