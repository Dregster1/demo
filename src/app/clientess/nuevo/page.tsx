'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function NuevoCliente() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    tipo: 'cliente',
  });

  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    try {
      // Insertar datos con un timeout para evitar errores de conexión
      const { error } = await supabase
        .from('clientes')
        .insert([formData])
        .select(); // Agrega .select() para obtener mejor feedback

      if (error) {
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      setMensaje('Cliente guardado correctamente ✅');
      setFormData({ nombre: '', correo: '', telefono: '', tipo: 'cliente' });
      
    } catch (err: any) {
      console.error('Error completo:', err);
      setMensaje(err.message || 'Ocurrió un error al guardar ❌');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-center">Nuevo Cliente / Acreedor</h1>

        <div>
          <label className="block text-sm mb-1">Nombre *</label>
          <input
            name="nombre"
            type="text"
            required
            value={formData.nombre}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Correo *</label>
          <input
            name="correo"
            type="email"
            required
            value={formData.correo}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Teléfono *</label>
          <input
            name="telefono"
            type="tel"
            required
            value={formData.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Tipo *</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="cliente">Cliente</option>
            <option value="acreedor">Acreedor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 rounded text-white font-medium transition-colors ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>

        {mensaje && (
          <p className={`text-center mt-2 text-sm ${
            mensaje.includes('✅') ? 'text-green-400' : 'text-red-400'
          }`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}