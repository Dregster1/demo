// components/GenerarRecibo.tsx
'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReciboPDF } from './ReciboPDF';
import { supabase } from '@/app/lib/supabase';

interface GenerarReciboProps {
  prestamoId: string;
  pagoId?: string;
  pagoData?: {
    numero: number;
    monto: number;
    fecha: string;
    saldo_anterior: number;
    saldo_restante: number;
    esMora?: boolean;
    monto_mora?: number;
    dias_atraso?: number;
  };
  prestamoData?: {
    nombre: string;
    dpi: string;
    codigo_cliente: string | null;
    monto: number;
    interes: number;
    fecha_inicio: string;
    porcentaje_mora?: number;
    tipo_mora?: string;
    monto_mora?: number;
  };
  className?: string;
}

export const GenerarRecibo = ({ 
  prestamoId, 
  pagoId, 
  pagoData, 
  prestamoData,
  className 
}: GenerarReciboProps) => {
  const [loading, setLoading] = useState(false);
  const [reciboData, setReciboData] = useState<any>(null);

  const generarNumeroRecibo = () => {
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `REC-${year}${month}${day}-${randomNum}`;
  };

  useEffect(() => {
    if (pagoData && prestamoData) {
      const numeroRecibo = generarNumeroRecibo();
      const totalConInteres = prestamoData.monto * (1 + prestamoData.interes / 100);
      
      setReciboData({
        prestamo: {
          nombre: prestamoData.nombre,
          dpi: prestamoData.dpi,
          codigo_cliente: prestamoData.codigo_cliente,
          monto: prestamoData.monto,
          interes: prestamoData.interes,
          porcentaje_mora: prestamoData.porcentaje_mora || 0,
          tipo_mora: prestamoData.tipo_mora || 'mensual',
          fecha_inicio: prestamoData.fecha_inicio,
          numero_recibo: numeroRecibo
        },
        pago: {
          numero: pagoData.numero,
          monto: pagoData.monto,
          monto_mora: pagoData.monto_mora || 0,
          dias_atraso: pagoData.dias_atraso || 0,
          esMora: pagoData.esMora || false,
          fecha_pago: pagoData.fecha,
          saldo_anterior: pagoData.saldo_anterior,
          saldo_restante: pagoData.saldo_restante
        }
      });
    }
  }, [pagoData, prestamoData]);

  const cargarDatosRecibo = async () => {
    setLoading(true);
    try {
      // Obtener datos del préstamo
      const { data: prestamoData, error: prestamoError } = await supabase
        .from('prestamos')
        .select('*')
        .eq('id', prestamoId)
        .single();

      if (prestamoError) throw prestamoError;

      // Obtener datos del pago si existe
      let pagoDataLocal = null;
      if (pagoId) {
        const { data: pago, error: pagoError } = await supabase
          .from('pagos')
          .select('*')
          .eq('id', pagoId)
          .single();

        if (pagoError) throw pagoError;
        pagoDataLocal = pago;
      }

      // Calcular total con interés
      const totalConInteres = prestamoData.monto * (1 + prestamoData.interes / 100);

      // Generar número de recibo
      const numeroRecibo = generarNumeroRecibo();

      // Calcular saldos si es un pago nuevo
      const saldoAnterior = pagoDataLocal 
        ? pagoDataLocal.saldo_anterior 
        : totalConInteres;
      
      const saldoRestante = pagoDataLocal 
        ? pagoDataLocal.saldo_restante 
        : totalConInteres - (pagoData?.monto || totalConInteres);

      setReciboData({
        prestamo: {
          nombre: prestamoData.nombre,
          dpi: prestamoData.dpi,
          codigo_cliente: prestamoData.codigo_cliente,
          monto: prestamoData.monto,
          interes: prestamoData.interes,
          porcentaje_mora: prestamoData.porcentaje_mora || 0,
          tipo_mora: prestamoData.tipo_mora || 'mensual',
          fecha_inicio: prestamoData.fecha_inicio,
          numero_recibo: numeroRecibo
        },
        pago: pagoDataLocal || {
          numero: pagoData?.numero || 1,
          monto: pagoData?.monto || totalConInteres,
          monto_mora: pagoData?.monto_mora || 0,
          dias_atraso: pagoData?.dias_atraso || 0,
          esMora: pagoData?.esMora || false,
          fecha_pago: pagoData?.fecha || new Date().toISOString(),
          saldo_restante: saldoRestante,
          saldo_anterior: saldoAnterior
        }
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {!reciboData ? (
        <button
          onClick={cargarDatosRecibo}
          disabled={loading}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs sm:text-sm ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Preparando...' : 'Generar Recibo'}
        </button>
      ) : (
        <PDFDownloadLink
          document={<ReciboPDF {...reciboData} />}
          fileName={`recibo_${reciboData.prestamo.numero_recibo}.pdf`}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs sm:text-sm block text-center"
        >
          {({ loading }) => (loading ? 'Generando...' : 'Descargar recibo')}
        </PDFDownloadLink>
      )}
    </div>
  );
};