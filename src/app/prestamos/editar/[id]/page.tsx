'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

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
  estado: 'pendiente' | 'pagado' | 'vencido' | 'moroso';
  porcentaje_mora: number;
  monto_mora: number;
  mora_aplicada: boolean;
}

export default function EditarPrestamo() {
  const { id } = useParams();
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
    estado: 'pendiente',
    porcentaje_mora: 10,
    monto_mora: 0,
    mora_aplicada: false,
  });

  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar los datos del préstamo al montar el componente
  useEffect(() => {
    const cargarPrestamo = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('prestamos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Préstamo no encontrado');

        setFormData({
          nombre: data.nombre,
          dpi: data.dpi,
          codigo_cliente: data.codigo_cliente || '',
          telefono: data.telefono,
          monto: data.monto.toString(),
          interes: data.interes.toString(),
          plazo: data.plazo.toString(),
          fecha_inicio: data.fecha_inicio.split('T')[0],
          frecuencia_pago: data.frecuencia_pago,
          estado: data.estado,
          porcentaje_mora: data.porcentaje_mora || 10,
          monto_mora: data.monto_mora || 0,
          mora_aplicada: data.mora_aplicada || false,
        });

      } catch (error: any) {
        console.error('Error al cargar préstamo:', error);
        setMensaje(`❌ Error: ${error.message || 'No se pudo cargar el préstamo'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) cargarPrestamo();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    try {
      // Validación básica de campos requeridos
      if (!formData.nombre || !formData.dpi || !formData.telefono || !formData.fecha_inicio) {
        throw new Error('Por favor complete todos los campos requeridos (*)');
      }

      // Validación de formato DPI (13 dígitos)
      if (!/^\d{13}$/.test(formData.dpi)) {
        throw new Error('El DPI debe contener exactamente 13 dígitos');
      }

      // Validación de porcentaje de mora
      if (isNaN(formData.porcentaje_mora)) {
        throw new Error('El porcentaje de mora debe ser un número válido');
      }
      if (formData.porcentaje_mora < 0) {
        throw new Error('El porcentaje de mora no puede ser negativo');
      }

      const { error } = await supabase
        .from('prestamos')
        .update({
          nombre: formData.nombre.trim(),
          dpi: formData.dpi.trim(),
          codigo_cliente: formData.codigo_cliente.trim() || null,
          telefono: formData.telefono.trim(),
          monto: parseFloat(formData.monto),
          interes: parseFloat(formData.interes),
          plazo: parseInt(formData.plazo),
          fecha_inicio: formData.fecha_inicio,
          frecuencia_pago: formData.frecuencia_pago,
          estado: formData.estado,
          porcentaje_mora: formData.porcentaje_mora,
          monto_mora: formData.monto_mora,
          mora_aplicada: formData.mora_aplicada,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setMensaje('✅ Préstamo actualizado correctamente');
      setTimeout(() => router.push('/prestamos'), 1500);

    } catch (error: any) {
      console.error('Error al actualizar:', error);
      setMensaje(`❌ Error: ${error.message || 'Ocurrió un error al actualizar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recalcular mora
  const recalcularMora = () => {
    if (confirm('¿Recalcular mora con el nuevo porcentaje?')) {
      const nuevaMora = parseFloat(formData.monto) * (formData.porcentaje_mora / 100);
      setFormData({
        ...formData,
        monto_mora: nuevaMora,
        estado: 'moroso',
        mora_aplicada: true
      });
    }
  };

  return (
    <div className="p-6 bg-[#a1b98a] text-white min-h-screen pt-24">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1f2d1b] max-w-md mx-auto p-6 rounded shadow"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Editar Préstamo</h1>

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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
            />
          </div>

          {/* Campo Porcentaje de Mora */}
          <div>
            <label htmlFor="porcentaje_mora" className="block text-sm font-medium mb-1">
              Porcentaje de Mora (%)
            </label>
            <input
              id="porcentaje_mora"
              name="porcentaje_mora"
              type="number"
              step="0.1"
              min="0"
              value={formData.porcentaje_mora}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
            />
          </div>

          {/* Mostrar información de mora si aplica */}
          {(formData.estado === 'moroso' || formData.estado === 'vencido') && (
            <div className="bg-red-900/30 p-3 rounded-lg">
              <p className="text-red-300">
                <span className="font-medium">Mora aplicada:</span> Q{formData.monto_mora.toFixed(2)}
              </p>
              <p className="text-red-400 font-medium">
                <span className="font-medium">Total con mora:</span> Q{(Number(formData.monto) + Number(formData.monto_mora)).toFixed(2)}
              </p>
              <button
                type="button"
                onClick={recalcularMora}
                className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                disabled={formData.estado !== 'vencido' && formData.estado !== 'moroso'}
              >
                Recalcular Mora
              </button>
            </div>
          )}

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
                className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
                className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
                className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
              />
            </div>
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
                className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
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
                className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>

          {/* Campo Estado */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium mb-1">
              Estado *
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600 focus:border-black focus:outline-none"
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
              <option value="moroso">Moroso</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 rounded font-medium ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/prestamos')}
              className="flex-1 py-2 rounded font-medium bg-green-700 hover:bg-green-900"
            >
              Cancelar
            </button>
          </div>

          {/* Mensaje de estado */}
          {mensaje && (
            <p className={`text-center mt-4 ${mensaje.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {mensaje}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}