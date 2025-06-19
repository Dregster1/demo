'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function NuevoBien() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('activo');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');
    setErrorDetalle('');

    try {
      // Validación básica
      if (!nombre || !valor) {
        throw new Error('Nombre y valor son campos requeridos');
      }

      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico)) {
        throw new Error('El valor debe ser un número válido');
      }

      // Insertar datos en Supabase
      const { data, error } = await supabase
        .from('balance')
        .insert([{
          nombre,
          valor: valorNumerico,
          tipo
        }])
        .select();

      if (error) {
        console.error('Error completo de Supabase:', {
          message: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }

      setMensaje('✅ Bien guardado correctamente');
      setTimeout(() => router.push('/balance'), 1500);

    } catch (error: any) {
      console.error('Error completo:', error);
      setMensaje('❌ Error al guardar el bien');
      
      // Muestra el mensaje de error completo
      if (error.message) {
        setErrorDetalle(error.message);
      } else if (error.code) {
        setErrorDetalle(`Código de error: ${error.code}`);
      } else {
        setErrorDetalle('Error desconocido. Ver consola para más detalles.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#a1b98a] text-white flex items-center justify-center px-4">
      <div className="bg-[#1f2d1b] border border-gray-700 rounded-lg p-8 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center text-white">Añadir Bien</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre del bien</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-3 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-3 rounded bg-[#e6f2da] placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="activo">Activo</option>
              <option value="pasivo">Pasivo</option>
            </select>
          </div>
          
        
        
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-green-700 hover:bg-green-900 text-white font-semibold py-2 px-4 rounded transition ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
          
          {mensaje && (
            <div className="mt-4">
              <p className={`text-center text-sm ${
                mensaje.includes('✅') ? 'text-green-400' : 'text-red-400'
              }`}>
                {mensaje}
              </p>
              {errorDetalle && (
                <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-red-300">
                  <p className="font-semibold">Detalles del error:</p>
                  <p>{errorDetalle}</p>
                  <p className="mt-1 text-gray-400">
                    Si el problema persiste, verifica la conexión o contacta al administrador.
                  </p>
                </div>
              )}
            </div>
          )}
      </form>
      </div>
    </div>
  );
}