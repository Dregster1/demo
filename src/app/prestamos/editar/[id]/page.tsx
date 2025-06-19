'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function EditarPrestamo() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    dpi: '',
    codigo_cliente: '',
    telefono: '',
    monto: '',
    interes: '',
    plazo: '',
    fecha_inicio: '',
    estado: 'pendiente'
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
          fecha_inicio: data.fecha_inicio.split('T')[0], // Formatear fecha para input date
          estado: data.estado
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

      const { error } = await supabase
        .from('prestamos')
        .update({
          nombre: formData.nombre.trim(),
          dpi: formData.dpi.trim(),
          codigo_cliente: formData.codigo_cliente.trim(),
          telefono: formData.telefono.trim(),
          monto: parseFloat(formData.monto) || 0,
          interes: parseFloat(formData.interes) || 0,
          plazo: parseInt(formData.plazo) || 0,
          fecha_inicio: formData.fecha_inicio,
          estado: formData.estado,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setMensaje('✅ Préstamo actualizado correctamente');
      // Redirigir después de 1.5 segundos
      setTimeout(() => router.push('/prestamos'), 1500);

    } catch (error: any) {
      console.error('Error completo:', error);
      setMensaje(`❌ Error: ${error.message || 'Ocurrió un error al actualizar'}`);
    } finally {
      setIsLoading(false);
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
            />
          </div>

          {/* Campo Monto */}
          <div>
            <label htmlFor="monto" className="block text-sm font-medium mb-1">
              Monto ($)
            </label>
            <input
              id="monto"
              name="monto"
              type="number"
              placeholder="Monto"
              min="0"
              step="0.01"
              value={formData.monto}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
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
              placeholder="Interés"
              min="0"
              max="100"
              step="0.1"
              value={formData.interes}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
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
              placeholder="Plazo"
              min="1"
              value={formData.plazo}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
            />
          </div>

          {/* Campo Fecha */}
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
            />
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
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border border-gray-600"
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
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