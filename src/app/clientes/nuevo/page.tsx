'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoCliente() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    dpi: '',
    codigo_cliente: '',
    correo: '',
    telefono: '',
    tipo: 'cliente',
    direccion: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    try {
      // Validación básica
      if (!formData.nombre || !formData.telefono || !formData.dpi) {
        throw new Error('Por favor complete los campos requeridos (*)');
      }

      // Validación de DPI (13 dígitos)
      if (!/^\d{13}$/.test(formData.dpi)) {
        throw new Error('El DPI debe contener exactamente 13 dígitos');
      }

      // Validación de correo si está presente
      if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
        throw new Error('Por favor ingrese un correo electrónico válido');
      }

      const { error } = await supabase
        .from('clientes')
        .insert([{
          ...formData,
          creado_en: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setMensaje('✅ Cliente guardado correctamente');
      setTimeout(() => router.push('/clientes'), 1500);

    } catch (err: any) {
      console.error('Error al guardar cliente:', {
        error: err,
        message: err.message,
        supabaseError: err.code
      });
      setMensaje(`❌ Error: ${err.message || 'Ocurrió un error al guardar'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#a1b98a] text-white p-6 flex justify-center items-center pt-24">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1f2d1b] p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-center">Nuevo Cliente / Acreedor</h1>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm mb-1">Nombre completo *</label>
            <input
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {/* DPI */}
          <div>
            <label className="block text-sm mb-1">Número de DPI (13 dígitos) *</label>
            <input
              name="dpi"
              type="text"
              required
              value={formData.dpi}
              onChange={handleChange}
              maxLength={13}
              pattern="\d{13}"
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="1234567890123"
            />
          </div>

          {/* Código de Cliente */}
          <div>
            <label className="block text-sm mb-1">Código de cliente</label>
            <input
              name="codigo_cliente"
              type="text"
              value={formData.codigo_cliente}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: CLI-001"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm mb-1">Correo electrónico</label>
            <input
              name="correo"
              type="email"
              value={formData.correo}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="ejemplo@correo.com"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm mb-1">Teléfono *</label>
            <input
              name="telefono"
              type="tel"
              required
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: 12345678"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm mb-1">Dirección</label>
            <textarea
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              rows={3}
              placeholder="Dirección completa"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm mb-1">Tipo *</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
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
                : 'bg-green-700 placeholder-green-900'
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
        </div>
      </form>
    </div>
  );
}