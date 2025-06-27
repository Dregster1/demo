// utils/calcularMora.ts
import { supabase } from '@/app/lib/supabase';
import { ResultadoMora, PrestamoParaMora } from '@/app/types/moraTypes';

export async function verificarYCalcularMora(): Promise<ResultadoMora> {
  const hoy = new Date().toISOString().split('T')[0];
  
  try {
    // 1. Obtener préstamos vencidos
    const { data: prestamosVencidos, error } = await supabase
      .from('prestamos')
      .select('*')
      .lt('fecha_vencimiento', hoy)
      .eq('estado', 'pendiente')
      .eq('mora_aplicada', false);

    if (error) throw error;
    if (!prestamosVencidos || prestamosVencidos.length === 0) {
      return { updated: 0 };
    }

    // 2. Procesar cada préstamo
    let updatedCount = 0;
    
    for (const prestamo of prestamosVencidos as PrestamoParaMora[]) {
      const resultado = await aplicarMoraIndividual(prestamo, hoy);
      if (resultado) updatedCount++;
    }

    return { updated: updatedCount };
    
  } catch (error: unknown) {
    console.error('Error en verificarYCalcularMora:', error);
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido al calcular mora' 
    };
  }
}

// Función auxiliar para tipado seguro
async function aplicarMoraIndividual(prestamo: PrestamoParaMora, hoy: string): Promise<boolean> {
  try {
    const fechaVenc = new Date(prestamo.fecha_vencimiento);
    const hoyDate = new Date(hoy);
    const diasMora = Math.floor((hoyDate.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
    
    // Cálculo seguro con tipos
    const moraDiaria = (prestamo.monto * prestamo.porcentaje_mora / 100) + 
                       (prestamo.monto * 0.01 * diasMora);
    const montoMora = Math.min(moraDiaria, prestamo.monto * 0.5);

    const { error } = await supabase
      .from('prestamos')
      .update({
        estado: 'moroso',
        monto_mora: parseFloat(montoMora.toFixed(2)),
        mora_aplicada: true,
        actualizado_en: hoy,
        dias_mora: diasMora
      })
      .eq('id', prestamo.id);

    return !error;
  } catch {
    return false;
  }
}