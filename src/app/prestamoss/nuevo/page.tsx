'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function NuevoPrestamo() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    monto: '',
    interes: '',
    plazo: '',
    fecha_inicio: '', // Cambiado a snake_case para coincidir con Supabase
  });

  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    try {
      // Validación básica
      if (!formData.nombre || !formData.telefono || !formData.fecha_inicio) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      const { error } = await supabase.from('prestamos').insert([
        {
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim(),
          monto: parseFloat(formData.monto) || 0,
          interes: parseFloat(formData.interes) || 0,
          plazo: parseInt(formData.plazo) || 0,
          fecha_inicio: formData.fecha_inicio,
          estado: 'activo', // Campo adicional recomendado
          creado_en: new Date().toISOString(),
        }
      ]);

      if (error) {
        throw error;
      }

      setMensaje('✅ Préstamo guardado correctamente');
      // Resetear formulario
      setFormData({
        nombre: '',
        telefono: '',
        monto: '',
        interes: '',
        plazo: '',
        fecha_inicio: '',
      });

    } catch (error: any) {
      console.error('Error completo:', error);
      setMensaje(`❌ Error: ${error.message || 'Ocurrió un error al guardar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 max-w-md mx-auto p-6 rounded shadow"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Nuevo Préstamo</h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">
              Nombre completo *
            </label>
            <input
              id="nombre"
              name="nombre"
              placeholder="Nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

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
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

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
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

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
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

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
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

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
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded font-medium ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>

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