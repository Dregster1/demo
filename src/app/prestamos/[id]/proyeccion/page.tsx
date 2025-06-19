// app/prestamos/[id]/proyeccion/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GenerarRecibo } from '@/app/components/GenerarRecibo';

interface Pago {
    numero: number;
    fecha: string;
    monto: number;
    estado: 'pendiente' | 'pagado' | 'vencido';
    id?: string; // Añadido para el ID del pago
}

interface Prestamo {
    id: string;
    nombre: string;
    monto: number;
    interes: number;
    plazo: number;
    frecuencia_pago: 'diario' | 'semanal' | 'quincenal' | 'mensual';
    fecha_inicio: string;
    dpi: string;
    codigo_cliente: string | null;
    telefono: string;
}

export default function ProyeccionPagos() {
    const { id } = useParams();
    const router = useRouter();
    const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);

                // Obtener datos del préstamo
                const { data: prestamoData, error: prestamoError } = await supabase
                    .from('prestamos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (prestamoError) throw prestamoError;
                if (!prestamoData) throw new Error('Préstamo no encontrado');

                setPrestamo(prestamoData);

                // Generar proyección de pagos
                const proyeccion = generarProyeccionPagos(
                    prestamoData.fecha_inicio,
                    prestamoData.plazo,
                    prestamoData.monto,
                    prestamoData.interes,
                    prestamoData.frecuencia_pago
                );

                setPagos(proyeccion);
            } catch (err: any) {
                setError(err.message || 'Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };

        if (id) cargarDatos();
    }, [id]);

    // Función para generar la proyección de pagos
    const generarProyeccionPagos = (
        fechaInicio: string,
        plazoMeses: number,
        montoTotal: number,
        interes: number,
        frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual'
    ): Pago[] => {
        const pagos: Pago[] = [];
        const fechaInicioObj = new Date(fechaInicio);
        const montoPago = calcularMontoPago(montoTotal, interes, plazoMeses, frecuencia);
        let fechaPago = new Date(fechaInicioObj);

        // Calcular número total de pagos según frecuencia
        const totalPagos = calcularTotalPagos(plazoMeses, frecuencia);

        for (let i = 1; i <= totalPagos; i++) {
            // Calcular fecha del pago según frecuencia
            switch (frecuencia) {
                case 'diario':
                    fechaPago.setDate(fechaPago.getDate() + 1);
                    break;
                case 'semanal':
                    fechaPago.setDate(fechaPago.getDate() + 7);
                    break;
                case 'quincenal':
                    fechaPago.setDate(fechaPago.getDate() + 15);
                    break;
                case 'mensual':
                    fechaPago.setMonth(fechaPago.getMonth() + 1);
                    break;
            }

            // Determinar estado del pago
            const hoy = new Date();
            let estado: 'pendiente' | 'pagado' | 'vencido' = 'pendiente';
            if (fechaPago < hoy) estado = 'vencido';

            pagos.push({
                numero: i,
                fecha: fechaPago.toISOString().split('T')[0],
                monto: montoPago,
                estado,
                id: `temp-${i}` // ID temporal para los pagos generados
            });
        }

        return pagos;
    };

    // Función auxiliar para calcular el monto de cada pago
    const calcularMontoPago = (
        montoTotal: number,
        interes: number,
        plazoMeses: number,
        frecuencia: string
    ): number => {
        const montoConInteres = montoTotal * (1 + interes / 100);
        let divisor = plazoMeses;

        // Ajustar divisor según frecuencia
        switch (frecuencia) {
            case 'diario':
                divisor *= 30; // Aproximación
                break;
            case 'semanal':
                divisor *= 4;
                break;
            case 'quincenal':
                divisor *= 2;
                break;
        }

        return parseFloat((montoConInteres / divisor).toFixed(2));
    };

    // Función auxiliar para calcular el total de pagos
    const calcularTotalPagos = (
        plazoMeses: number,
        frecuencia: string
    ): number => {
        switch (frecuencia) {
            case 'diario':
                return plazoMeses * 30; // Aproximación
            case 'semanal':
                return plazoMeses * 4;
            case 'quincenal':
                return plazoMeses * 2;
            case 'mensual':
                return plazoMeses;
            default:
                return plazoMeses;
        }
    };

    // Función para cambiar estado de pago
    const cambiarEstadoPago = (index: number, nuevoEstado: 'pendiente' | 'pagado' | 'vencido') => {
        const nuevosPagos = [...pagos];
        nuevosPagos[index].estado = nuevoEstado;
        setPagos(nuevosPagos);

        // Aquí podrías guardar el cambio en Supabase si lo necesitas
    };


    if (error) {
        return (
            <div className="min-h-screen bg-[#a1b98a] text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/prestamos')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        Volver a préstamos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#a1b98a] text-white p-4 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        Proyección: {prestamo?.nombre}
                    </h1>
                    <Link
                        href={`/prestamos`}
                        className="bg-green-700 hover:bg-green-900 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
                    >
                        Volver a los préstamos
                    </Link>
                </div>

                {/* Resumen */}
                <div className="bg-[#1f2d1b] rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Monto total</p>
                            <p className="text-lg sm:text-xl font-semibold">Q{prestamo?.monto.toFixed(2)}</p>
                        </div>
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Interés</p>
                            <p className="text-lg sm:text-xl font-semibold">{prestamo?.interes}%</p>
                        </div>
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Frecuencia</p>
                            <p className="text-lg sm:text-xl font-semibold capitalize">{prestamo?.frecuencia_pago}</p>
                        </div>
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Total pagos</p>
                            <p className="text-lg sm:text-xl font-semibold">{pagos.length}</p>
                        </div>
                    </div>
                </div>

                {/* Lista de pagos - Versión móvil */}
                <div className="sm:hidden space-y-2">
                    {pagos.map((pago, index) => (
                        <div key={index} className="bg-[#1f2d1b] rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium">Pago #{pago.numero}</span>
                                <span className={`px-2 py-1 rounded text-xs ${pago.estado === 'pagado' ? 'bg-green-900 text-green-300' :
                                    pago.estado === 'vencido' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                                    }`}>
                                    {pago.estado}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-400">Fecha</p>
                                    <p>{new Date(pago.fecha).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Monto</p>
                                    <p>Q{pago.monto.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <select
                                    value={pago.estado}
                                    onChange={(e) => cambiarEstadoPago(index, e.target.value as 'pendiente' | 'pagado' | 'vencido')}
                                    className="w-full bg-gray-700 text-white p-1 rounded text-xs"
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="pagado">Pagado</option>
                                    <option value="vencido">Vencido</option>
                                </select>
                                <GenerarRecibo
                                    prestamoId={id as string}
                                    pagoId={pago.id}

                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabla de pagos - Versión desktop */}
                <div className="hidden sm:block bg-[#1f2d1b] rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3 text-left text-sm">#</th>
                                <th className="p-3 text-left text-sm">Fecha</th>
                                <th className="p-3 text-left text-sm">Monto</th>
                                <th className="p-3 text-left text-sm">Estado</th>
                                <th className="p-3 text-left text-sm">Acciones</th>
                                <th className="p-3 text-left text-sm">Recibo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagos.map((pago, index) => (
                                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 text-sm">{pago.numero}</td>
                                    <td className="p-3 text-sm">{new Date(pago.fecha).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm">Q{pago.monto.toFixed(2)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${pago.estado === 'pagado' ? 'bg-green-900 text-green-300' :
                                            pago.estado === 'vencido' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                                            }`}>
                                            {pago.estado}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={pago.estado}
                                            onChange={(e) => cambiarEstadoPago(index, e.target.value as 'pendiente' | 'pagado' | 'vencido')}
                                            className="bg-gray-700 text-white p-1 rounded text-sm"
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="pagado">Pagado</option>
                                            <option value="vencido">Vencido</option>
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <GenerarRecibo
                                            prestamoId={id as string}
                                            prestamoData={{
                                                nombre: prestamo.nombre,
                                                dpi: prestamo.dpi,
                                                codigo_cliente: prestamo.codigo_cliente,
                                                monto: prestamo.monto,
                                                interes: prestamo.interes,
                                                fecha_inicio: prestamo.fecha_inicio
                                            }}
                                            pagoData={{
                                                numero: pago.numero,
                                                monto: pago.monto,
                                                fecha: pago.fecha,
                                                saldo_anterior: prestamo.monto * (1 + prestamo.interes / 100) - (pago.monto * (pago.numero - 1)),
                                                saldo_restante: prestamo.monto * (1 + prestamo.interes / 100) - (pago.monto * pago.numero)
                                            }}
                                            className="text-sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}