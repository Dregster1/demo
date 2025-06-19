'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

interface Bien {
  id: string;
  nombre: string;
  valor: number;
  tipo: 'activo' | 'pasivo';
  fecha_creacion: string;
}

export default function EditarBien() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    valor: '',
    tipo: 'activo'
  });
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar los datos del bien al montar el componente
  useEffect(() => {
    const cargarBien = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('balance')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Registro no encontrado');

        setFormData({
          nombre: data.nombre,
          valor: data.valor.toString(),
          tipo: data.tipo
        });

      } catch (error: any) {
        console.error('Error al cargar registro:', error);
        setMensaje(`❌ Error: ${error.message || 'No se pudo cargar el registro'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) cargarBien();
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
      // Validación básica
      if (!formData.nombre || !formData.valor) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      const valorNumerico = parseFloat(formData.valor);
      if (isNaN(valorNumerico)) {
        throw new Error('El valor debe ser un número válido');
      }

      const { error } = await supabase
        .from('balance')
        .update({
          nombre: formData.nombre.trim(),
          valor: valorNumerico,
          tipo: formData.tipo,
          actualizado_en: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setMensaje('✅ Registro actualizado correctamente');
      setTimeout(() => router.push('/balance'), 1500);

    } catch (error: any) {
      console.error('Error al actualizar:', error);
      setMensaje(`❌ Error: ${error.message || 'Ocurrió un error al actualizar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#a1b98a] text-white p-6 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1f2d1b] p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-center">Editar Registro</h1>

        <div className="space-y-4">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border-gray-600 focus:border-black focus:outline-none"
              placeholder="Ej: Cuenta bancaria"
            />
          </div>

          {/* Campo Valor */}
          <div>
            <label htmlFor="valor" className="block text-sm font-medium mb-1">
              Valor (Q) *
            </label>
            <input
              id="valor"
              name="valor"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.valor}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border-gray-600 focus:border-black focus:outline-none"
              placeholder="Ej: 5000.00"
            />
          </div>

          {/* Campo Tipo */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium mb-1">
              Tipo *
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              value={formData.tipo}
              onChange={handleChange}
              className="w-full p-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black border-gray-600 focus:border-black focus:outline-none"
            >
              <option value="activo">Activo</option>
              <option value="pasivo">Pasivo</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 rounded font-medium ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/balance')}
              disabled={isLoading}
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