'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

interface FormData {
  nombre: string;
  dpi: string;
  codigo_cliente: string;
  telefono: string;
  monto: string;
  interes: string;
  plazo: string;
  fecha_inicio: string;
  frecuencia_pago: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  porcentaje_mora: number;
  tipo_interes: 'sobre_capital' | 'sobre_saldos';
  tipo_mora: 'diaria' | 'mensual' | 'anual';
  descripcion? : string;
}

export default function NuevoPrestamo() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    dpi: '',
    codigo_cliente: '',
    telefono: '',
    monto: '',
    interes: '',
    plazo: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    frecuencia_pago: 'mensual',
    porcentaje_mora: 0,
    tipo_interes: 'sobre_capital',
    tipo_mora: 'mensual',
    descripcion: '',
  });

  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement  | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    try {
      // Validación de campos requeridos
      if (!formData.nombre || !formData.dpi || !formData.telefono || !formData.fecha_inicio) {
        throw new Error('Por favor complete todos los campos requeridos (*)');
      }

      // Validación de DPI (13 dígitos)
      if (!/^\d{13}$/.test(formData.dpi)) {
        throw new Error('El DPI debe contener exactamente 13 dígitos');
      }

      // Validación de teléfono (mínimo 8 caracteres)
      if (formData.telefono.length < 8) {
        throw new Error('El teléfono debe tener al menos 8 dígitos');
      }

      if (isNaN(formData.porcentaje_mora)) {
        throw new Error('El porcentaje de mora debe ser un número válido');
      }
      if (formData.porcentaje_mora < 0) {
        throw new Error('El porcentaje de mora no puede ser negativo');
      }
      if (formData.porcentaje_mora > 100) {
        throw new Error('El porcentaje de mora no puede ser mayor a 100');
      }

      // Validación de montos numéricos
      if (isNaN(parseFloat(formData.monto)) || isNaN(parseFloat(formData.interes)) || isNaN(parseInt(formData.plazo))) {
        throw new Error('Los campos numéricos deben contener valores válidos');
      }



      const { error } = await supabase.from('prestamos').insert([
        {
          nombre: formData.nombre.trim(),
          dpi: formData.dpi.trim(),
          codigo_cliente: formData.codigo_cliente.trim() || null,
          telefono: formData.telefono.trim(),
          monto: parseFloat(formData.monto),
          interes: parseFloat(formData.interes),
          plazo: parseInt(formData.plazo),
          fecha_inicio: formData.fecha_inicio,
          frecuencia_pago: formData.frecuencia_pago,
          estado: 'pendiente',
          creado_en: new Date().toISOString(),
          fecha_vencimiento: calcularFechaVencimiento(formData.fecha_inicio, parseInt(formData.plazo)),
          porcentaje_mora: formData.porcentaje_mora, // Asegúrate de incluir este campo
          mora_aplicada: false, // Valor inicial
          monto_mora: 0, // Valor inicial
          tipo_interes: formData.tipo_interes,
          tipo_mora: formData.tipo_mora,
          descripcion: formData.descripcion || null
        }
      ]);

      if (error) throw error;

      setMensaje('✅ Préstamo creado correctamente');
      setTimeout(() => router.push('/prestamos'), 1500);

    } catch (error: any) {
      console.error('Error al guardar préstamo:', error);
      setMensaje(`❌ Error: ${error.message || 'Ocurrió un error al guardar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (fechaInicio: string, plazoMeses: number): string => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + plazoMeses);
    return fecha.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 bg-[#a1b98a] text-white min-h-screen pt-24">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1f2d1b] max-w-md mx-auto p-6 rounded shadow"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Nuevo Préstamo</h1>

        <div className="space-y-4">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">
              Nombre completo *
            </label>
            <input
              id="nombre"
              name="nombre"
              placeholder="Nombre completo"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border  border-gray-600 focus:border-black focus:outline-none "
            />
          </div>

          {/* Campo DPI */}
          <div>
            <label htmlFor="dpi" className="block text-sm font-medium mb-1">
              Número de DPI (13 dígitos) *
            </label>
            <input
              id="dpi"
              name="dpi"
              placeholder="1234567890123"
              required
              value={formData.dpi}
              onChange={handleChange}
              maxLength={13}
              pattern="\d{13}"
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black focus:border-black focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Campo Código de Cliente */}
          <div>
            <label htmlFor="codigo_cliente" className="block text-sm font-medium mb-1">
              Código de Cliente
            </label>
            <input
              id="codigo_cliente"
              name="codigo_cliente"
              placeholder="CLI-001"
              value={formData.codigo_cliente}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black focus:border-black focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Campo Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium mb-1">
              Teléfono *
            </label>
            <input
              id="telefono"
              name="telefono"
              placeholder="Teléfono"
              required
              value={formData.telefono}
              onChange={handleChange}
              minLength={8}
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black focus:border-black focus:outline-none placeholder-gray-500"
            />
          </div>

          {/* Campo Tipo de Mora */}
          <div className="mb-4">
            <label htmlFor="tipo_mora" className="block text-sm font-medium mb-1">
              Tipo de Mora *
            </label>
            <select
              id="tipo_mora"
              name="tipo_mora"
              required
              value={formData.tipo_mora}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black focus:border-black focus:outline-none"
            >
              <option value="diaria">Diaria</option>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {formData.tipo_mora === 'diaria'
                ? "La mora se calculará por día de atraso"
                : formData.tipo_mora === 'mensual'
                  ? "La mora se calculará por mes de atraso"
                  : "La mora se calculará por año de atraso"}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Porcentaje de Mora (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              name="porcentaje_mora" // Agrega name para usar handleChange
              value={formData.porcentaje_mora}
              onChange={handleChange} // Usa el mismo manejador que los demás campos
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black focus:border-black focus:outline-none placeholder-gray-500"
              placeholder="Ej: 10"
            />
          </div>

          {/* Grupo de campos numéricos */}
          <div className="grid grid-cols-3 gap-4">
            {/* Campo Monto */}
            <div>
              <label htmlFor="monto" className="block text-sm font-medium mb-1">
                Monto (Q)
              </label>
              <input
                id="monto"
                name="monto"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                value={formData.monto}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black placeholder-gray-500"
              />
            </div>

            {/* Campo Interés */}
            <div>
              <label htmlFor="interes" className="block text-sm font-medium mb-1">
                Interés (%)
              </label>
              <input
                id="interes"
                name="interes"
                type="number"
                placeholder="0.0"
                min="0"
                max="100"
                step="0.1"
                required
                value={formData.interes}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black placeholder-gray-500"
              />
            </div>

            {/* Campo Plazo */}
            <div>
              <label htmlFor="plazo" className="block text-sm font-medium mb-1">
                Plazo (meses)
              </label>
              <input
                id="plazo"
                name="plazo"
                type="number"
                placeholder="0"
                min="1"
                required
                value={formData.plazo}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black placeholder-gray-500"
              />
            </div>
          </div>

          {/* Campo Tipo de Interés */}
          <div className="mb-4">
            <label htmlFor="tipo_interes" className="block text-sm font-medium mb-1">
              Tipo de Interés *
            </label>
            <select
              id="tipo_interes"
              name="tipo_interes"
              required
              value={formData.tipo_interes}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black"
            >
              <option value="sobre_capital">Sobre capital inicial</option>
              <option value="sobre_saldos">Sobre saldos decrecientes</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {formData.tipo_interes === 'sobre_capital'
                ? "Interés calculado sobre el monto total del préstamo"
                : "Interés calculado sobre el saldo pendiente cada período"}
            </p>
          </div>

          {/* Grupo de campos de fecha y frecuencia */}
          <div className="grid grid-cols-2 gap-4">
            {/* Campo Fecha de Inicio */}
            <div>
              <label htmlFor="fecha_inicio" className="block text-sm font-medium mb-1">
                Fecha de inicio *
              </label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black placeholder-gray-500 "
              />
            </div>

            {/* Campo Frecuencia de Pago */}
            <div>
              <label htmlFor="frecuencia_pago" className="block text-sm font-medium mb-1">
                Frecuencia de pago *
              </label>
              <select
                id="frecuencia_pago"
                name="frecuencia_pago"
                required
                value={formData.frecuencia_pago}
                onChange={handleChange}
                className="w-full p-2 rounded bg-[#e6f2da] border border-gray-600 text-black placeholder-gray-500"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            
          </div>
          
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="Descripción u observaciones"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border  border-gray-600 focus:border-black focus:outline-none "
            />
          </div>

          {/* Botón de enviar */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded font-medium mt-4 ${isLoading ? 'bg-green-700 cursor-not-allowed' : 'bg-green-700 hover:bg-green-900'
              }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar Préstamo'}
          </button>

          {/* Mensaje de estado */}
          {mensaje && (
            <p className={`text-center mt-4 ${mensaje.includes('✅') ? 'text-green-400' : 'text-red-400'
              }`}>
              {mensaje}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}