"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

// Mapeo estructurado para los selects dependientes
const ESTRUCTURA_GASTOS: Record<string, string[]> = {
  "Mantenimiento": ["Repuesto", "Lubricante", "Cauchos", "Latoneria y Pintura", "Oficina y Planta"],
  "Produccion": ["Arena", "Piedra", "Cemento", "Aditivo", "Fibra", "Flete"],
  "Servicios": ["Luz", "Agua", "Teléfono", "Internet", "Aseo"],
  "Gasto de Personal": ["Nomina", "Uniformes", "Implemento de Seguridad", "Seguro Social", "FAOV", "Inces", "Utilidades", "Vacaciones", "Fideicomiso", "Bono de Alimentación", "Comisiones de Ventas"],
  "Impuestos y Contribuciones": ["Seniat", "Alcaldía", "Timbres Fiscales", "Aranceles"]
};

export default function EgresoForm() {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { 
      fecha: new Date().toISOString().split("T")[0],
      montoBs: 0
    }
  });
  
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const clasificacion = watch("clasificacionGasto");
  const subCategoria = watch("subCategoria");
  const montoBs = watch("montoBs", 0);

  // Obtener Tasa BCV
  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch('/api/bcv');
        const data = await res.json();
        if (data.success) {
          setTasaCambio(data.tasa);
          setValue("tasaCambio", data.tasa);
        }
      } catch (error) {
        console.error("Error al cargar la tasa", error);
      } finally {
        setCargandoTasa(false);
      }
    };
    fetchTasa();
  }, [setValue]);

  // Convertir a dólares en tiempo real
  useEffect(() => {
    if (tasaCambio > 0) {
      const bs = parseFloat(montoBs.toString()) || 0;
      setValue("montoDivisa", (bs / tasaCambio).toFixed(2));
    }
  }, [montoBs, tasaCambio, setValue]);

  // Resetear subcategoría si cambia la categoría principal
  useEffect(() => {
    setValue("subCategoria", "");
  }, [clasificacion, setValue]);

  // Determinar la renderización de campos condicionales
  const requiereCamion = clasificacion === "Mantenimiento" && ["Repuesto", "Lubricante", "Cauchos", "Latoneria y Pintura"].includes(subCategoria);
  const requiereCantidades = clasificacion === "Produccion" && subCategoria !== "";

  // Helper para mostrar la unidad en el placeholder dependiendo del material de producción
  const getUnidadMaterial = () => {
    switch(subCategoria) {
      case "Arena": case "Piedra": case "Flete": return "M3";
      case "Cemento": return "Toneladas";
      case "Aditivo": return "Litros";
      case "Fibra": return "Bolsas";
      default: return "Cantidad";
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMensaje({ tipo: "", texto: "" });
    
    // Preparar el JSON para los detalles extra condicionales
    const payload = {
        ...data,
        detalleExtra: {
            camion: requiereCamion ? data.camion : null,
            cantidad: requiereCantidades ? parseFloat(data.cantidad) : null,
            precioUnitario: requiereCantidades ? parseFloat(data.precioUnitario) : null,
            unidadMedida: requiereCantidades ? getUnidadMaterial() : null
        }
    };

    try {
      const response = await fetch("/api/egresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        setMensaje({ tipo: "exito", texto: "Egreso registrado correctamente en el sistema." });
        reset({ fecha: new Date().toISOString().split("T")[0] }); // Limpiar pero dejar fecha de hoy
      } else {
        setMensaje({ tipo: "error", texto: result.error || "Error al registrar el egreso." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Registro de Egreso / Gasto</h2>
        <div className="bg-red-50 text-red-800 px-4 py-2 rounded-md font-semibold border border-red-200 shadow-sm">
          {cargandoTasa ? "Obteniendo BCV..." : `Tasa BCV: Bs. ${tasaCambio}`}
        </div>
      </div>
      
      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded font-medium ${mensaje.tipo === "error" ? "bg-red-100 text-red-700 border-l-4 border-red-500" : "bg-green-100 text-green-700 border-l-4 border-green-500"}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Lado Izquierdo: Datos de Salida de Dinero */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-gray-700 bg-gray-50 p-2 rounded">Datos del Pago a Proveedor</h3>
          
          <input type="hidden" {...register("tasaCambio")} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Proveedor / Beneficiario</label>
            <input type="text" {...register("nombreProveedor", { required: true })} className="w-full border border-gray-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RIF / Cédula</label>
            <input type="text" {...register("rif", { required: true })} className="w-full border border-gray-300 rounded-md p-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banco Origen</label>
              <select {...register("banco", { required: true })} className="w-full border border-gray-300 rounded-md p-2">
                <option value="">Seleccione...</option>
                <option value="Mercantil">Mercantil</option>
                <option value="Banesco">Banesco</option>
                <option value="Caja Chica">Caja Chica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
              <input type="text" {...register("referencia", { required: true })} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs)</label>
              <input type="number" step="0.01" {...register("montoBs", { required: true })} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equivalente (USD)</label>
              <input type="number" step="0.01" {...register("montoDivisa")} readOnly className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Egreso</label>
            <input type="date" {...register("fecha", { required: true })} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
        </div>

        {/* Lado Derecho: Clasificación y Detalles */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-gray-700 bg-gray-50 p-2 rounded">Clasificación del Gasto</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clasificación General</label>
            <select {...register("clasificacionGasto", { required: true })} className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500">
              <option value="">Seleccione una categoría...</option>
              {Object.keys(ESTRUCTURA_GASTOS).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {clasificacion && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo / Subcategoría</label>
              <select {...register("subCategoria", { required: true })} className="w-full border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500">
                <option value="">Seleccione el detalle...</option>
                {ESTRUCTURA_GASTOS[clasificacion].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* CAMPOS DINÁMICOS DEPENDIENDO DE LA SELECCIÓN */}
          {requiereCamion && (
            <div className="animate-in fade-in zoom-in duration-300 bg-blue-50 p-4 rounded-md border border-blue-200">
              <label className="block text-sm font-bold text-blue-800 mb-1">Identificador del Camión Asignado</label>
              <input type="text" {...register("camion", { required: requiereCamion })} className="w-full border border-blue-300 rounded-md p-2" placeholder="Ej: Placa, Número interno, etc." />
            </div>
          )}

          {requiereCantidades && (
            <div className="animate-in fade-in zoom-in duration-300 grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-md border border-orange-200">
              <div>
                <label className="block text-sm font-bold text-orange-800 mb-1">Cantidad ({getUnidadMaterial()})</label>
                <input type="number" step="0.01" {...register("cantidad", { required: requiereCantidades })} className="w-full border border-orange-300 rounded-md p-2" placeholder={`Total en ${getUnidadMaterial()}`} />
              </div>
              <div>
                <label className="block text-sm font-bold text-orange-800 mb-1">Precio Unitario</label>
                <input type="number" step="0.01" {...register("precioUnitario", { required: requiereCantidades })} className="w-full border border-orange-300 rounded-md p-2" placeholder="Precio x unidad" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto o Descripción Adicional</label>
            <textarea {...register("descripcion")} className="w-full border border-gray-300 rounded-md p-2" rows={3} placeholder="Detalles de la compra, factura física, etc."></textarea>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 pt-4 border-t mt-4">
          <button 
            type="submit" 
            disabled={isLoading || cargandoTasa}
            className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? "Guardando..." : "Procesar y Registrar Egreso"}
          </button>
        </div>
      </form>
    </div>
  );
}