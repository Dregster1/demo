// app/prestamos/[id]/proyeccion/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GenerarRecibo } from '@/app/components/GenerarRecibo';
import GenerarEstadoCliente from '@/app/components/GenerarEstadoCliente';
import { Prestamo, Pago } from '../../../types/types';



export default function ProyeccionPagos() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cargado, setCargado] = useState(false);
    const [inicializado, setInicializado] = useState(false);



useEffect(() => {
    if (!inicializado) {
        const cargarDatosInicial = async () => {
            try {
                setLoading(true);
                
                // 1. Cargar préstamo
                const { data: prestamoData, error: prestamoError } = await supabase
                    .from('prestamos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (prestamoError || !prestamoData) {
                    throw prestamoError || new Error('Préstamo no encontrado');
                }

                // 2. Verificar si ya hay pagos
                const { data: pagosExistentes, error: pagosError } = await supabase
                    .from('pagos')
                    .select('*')
                    .eq('prestamo_id', id)
                    .order('numero', { ascending: true });

                if (pagosError) throw pagosError;

                let pagosFinales: Pago[] = [];

                if (pagosExistentes && pagosExistentes.length > 0) {
                    // Caso 1: Pagos existentes - verificar duplicados
                    const pagosUnicos = eliminarDuplicados(pagosExistentes);
                    pagosFinales = verificarYCalcularMora(pagosUnicos, prestamoData);
                    
                    // Actualizar en base de datos si hay cambios
                    if (JSON.stringify(pagosExistentes) !== JSON.stringify(pagosFinales)) {
                        const { error } = await supabase
                            .from('pagos')
                            .upsert(pagosFinales)
                            .eq('prestamo_id', id);
                        if (error) throw error;
                    }
                } else {
                    // Caso 2: Generar nueva proyección
                    const nuevaProyeccion = generarProyeccionPagos(prestamoData);
                    pagosFinales = verificarYCalcularMora(nuevaProyeccion, prestamoData);
                    
                    // Insertar solo si no hay pagos existentes
                    const { data: pagosInsertados, error } = await supabase
                        .from('pagos')
                        .insert(pagosFinales)
                        .select();
                    
                    if (error) throw error;
                    if (pagosInsertados) pagosFinales = pagosInsertados;
                }

                // Actualizar estados
                setPrestamo(prestamoData);
                setPagos(pagosFinales);
                await verificarEstadoPrestamo(id);

            } catch (error) {
                console.error('Error al cargar datos:', error);
                setError(error instanceof Error ? error.message : 'Error desconocido');
            } finally {
                setLoading(false);
                setInicializado(true);
            }
        };

        cargarDatosInicial();
    }
}, [id, inicializado]);

// Función para eliminar pagos duplicados
const eliminarDuplicados = (pagos: Pago[]): Pago[] => {
    const unicos: Pago[] = [];
    const numerosVistos = new Set<number>();

    for (const pago of pagos) {
        if (!numerosVistos.has(pago.numero)) {
            numerosVistos.add(pago.numero);
            unicos.push(pago);
        }
    }

    return unicos.sort((a, b) => a.numero - b.numero);
};  


    // Función para generar la proyección de pagos con mora
  const generarProyeccionPagos = (prestamo: Prestamo): Pago[] => {
    const pagos: Pago[] = [];
    const fechaInicio = new Date(prestamo.fecha_inicio);
    let fechaPago = new Date(fechaInicio);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const totalPagos = calcularTotalPagos(prestamo.plazo, prestamo.frecuencia_pago);
    let saldoPendiente = prestamo.monto;

    for (let i = 1; i <= totalPagos; i++) {
        // Calcular fecha según frecuencia
        switch (prestamo.frecuencia_pago) {
            case 'diario': fechaPago.setDate(fechaPago.getDate() + 1); break;
            case 'semanal': fechaPago.setDate(fechaPago.getDate() + 7); break;
            case 'quincenal': fechaPago.setDate(fechaPago.getDate() + 15); break;
            case 'mensual': fechaPago.setMonth(fechaPago.getMonth() + 1); break;
        }

        // Calcular componentes del pago
        let capitalPago = prestamo.monto / totalPagos;
        let interesPago = 0;

        if (prestamo.tipo_interes === 'sobre_saldos') {
            interesPago = saldoPendiente * (prestamo.interes / 100) /
                (prestamo.frecuencia_pago === 'mensual' ? 1 :
                    prestamo.frecuencia_pago === 'quincenal' ? 2 :
                        prestamo.frecuencia_pago === 'semanal' ? 4 : 30);
            saldoPendiente -= capitalPago;
        } else {
            interesPago = (prestamo.monto * (prestamo.interes / 100)) / totalPagos;
        }

        const montoPago = capitalPago + interesPago;
        const fechaPagoNormalizada = new Date(fechaPago);
        fechaPagoNormalizada.setHours(0, 0, 0, 0);
        const estado = fechaPagoNormalizada < hoy ? 'vencido' : 'pendiente';

        pagos.push({
            id: crypto.randomUUID(), // Generar ID único aquí
            numero: i,
            fecha: fechaPago.toISOString().split('T')[0],
            monto: parseFloat(montoPago.toFixed(2)),
            capital: parseFloat(capitalPago.toFixed(2)),
            interes: parseFloat(interesPago.toFixed(2)),
            estado,
            prestamo_id: prestamo.id,
            es_mora: false,
            fecha_pago: null,
        });
    }

    return pagos;
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

    const verificarEstadoPrestamo = async (prestamoId: string) => {
        try {
            const { data: pagos, error } = await supabase
                .from('pagos')
                .select('estado, es_mora')
                .eq('prestamo_id', prestamoId);

            if (error) throw error;

            let nuevoEstado: 'pendiente' | 'pagado' | 'vencido' | 'moroso' = 'pendiente';

            if (pagos && pagos.length > 0) {
                const todosPagados = pagos.every(p => p.estado === 'pagado');
                const tieneMorosos = pagos.some(p => p.es_mora);
                const tieneVencidos = pagos.some(p => p.estado === 'vencido');

                if (todosPagados) {
                    nuevoEstado = 'pagado';
                } else if (tieneMorosos || tieneVencidos) {
                    nuevoEstado = 'moroso';
                }
            }

            // Actualizar solo si cambió
            if (prestamo?.estado !== nuevoEstado) {
                const { error: updateError } = await supabase
                    .from('prestamos')
                    .update({ estado: nuevoEstado })
                    .eq('id', prestamoId);

                if (updateError) throw updateError;

                setPrestamo(prev => prev ? { ...prev, estado: nuevoEstado } : null);
            }

            return nuevoEstado;
        } catch (error) {
            console.error('Error al verificar estado:', error);
            return null;
        }
    };


    // Función para cambiar estado de pago
    const cambiarEstadoPago = async (index: number, nuevoEstado: 'pendiente' | 'pagado' | 'vencido' | 'moroso') => {
        const pago = pagos[index];
        if (!pago?.id) {
            alert('Pago no válido');
            return;
        }

        // Guardar estado anterior para rollback
        const estadoAnterior = pago.estado;
        const fechaPagoAnterior = pago.fecha_pago;

        // Actualización optimista
        const nuevosPagos = [...pagos];
        nuevosPagos[index] = {
            ...pago,
            estado: nuevoEstado,
            fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString() : null
        };
        setPagos(nuevosPagos);

        try {
            // 1. Actualizar en Supabase
            const { data: updateData, error: updateError } = await supabase
                .from('pagos')
                .update({
                    estado: nuevoEstado,
                    fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString() : null
                })
                .eq('id', pago.id)
                .select(); // 👈 muy importante para recibir `data`

            if (updateError) throw updateError;
            if (!updateData || updateData.length === 0) {
                throw new Error(`No se encontró el pago con ID: ${pago.id}`);
            }

            // 2. Verificar que el cambio se guardó
            const { data: pagoActualizado, error: fetchError } = await supabase
                .from('pagos')
                .select('*')
                .eq('id', pago.id)
                .single();

            if (fetchError || !pagoActualizado) {
                throw new Error('No se pudo verificar el pago actualizado');
            }

            if (pagoActualizado.estado !== nuevoEstado) {
                throw new Error('El estado no se actualizó correctamente en la base de datos');
            }

            // 3. Actualizar estado del préstamo si todos están pagados
            const { data: todosPagos } = await supabase
                .from('pagos')
                .select('estado')
                .eq('prestamo_id', id);

            if (todosPagos?.every(p => p.estado === 'pagado')) {
                await supabase
                    .from('prestamos')
                    .update({ estado: 'pagado' })
                    .eq('id', id);
            }

        } catch (error) {
            // Revertir cambios en caso de error
            nuevosPagos[index] = {
                ...pago,
                estado: estadoAnterior,
                fecha_pago: fechaPagoAnterior
            };
            setPagos(nuevosPagos);

            console.error('Error al actualizar estado:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'No se pudo guardar el cambio'}`);
        }

    };


    const verificarYCalcularMora = (pagos: Pago[], prestamo: Prestamo): Pago[] => {

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Normalizar hora para comparación

        return pagos.map(pago => {
            // Saltar pagos ya pagados
            if (pago.estado === 'pagado') return pago;

            const fechaVencimiento = new Date(pago.fecha);
            fechaVencimiento.setHours(0, 0, 0, 0);

            // Si el pago está vencido
            if (fechaVencimiento < hoy) {
                const diffTime = hoy.getTime() - fechaVencimiento.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    // Calcular factor según tipo de mora
                    let factor = diffDays; // Diario por defecto
                    if (prestamo.tipo_mora === 'mensual') factor = Math.ceil(diffDays / 30);
                    if (prestamo.tipo_mora === 'anual') factor = Math.ceil(diffDays / 365);

                    // Calcular mora
                    const moraCalculada = pago.monto * (prestamo.porcentaje_mora / 100) * factor;

                    return {
                        ...pago,
                        estado: pago.estado === 'vencido' ? 'vencido' : 'moroso',
                        es_mora: true,
                        dias_atraso: diffDays,
                        monto_mora: parseFloat(moraCalculada.toFixed(2))
                    };
                }
            }

            return pago;
        });
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-[#a1b98a] text-white flex items-center justify-center">
                <p>Cargando proyección...</p>
            </div>
        );
    }



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

    if (!prestamo) {
        return (
            <div className="min-h-screen bg-[#a1b98a] text-white flex items-center justify-center">
                <p>No se encontró el préstamo</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#a1b98a] text-white p-4 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        Proyección: {prestamo.nombre}
                    </h1>
                    <GenerarEstadoCliente
                        prestamo={prestamo}
                        pagos={pagos}
                        className="mt-4"
                    />
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
                            <p className="text-lg sm:text-xl font-semibold">Q{prestamo.monto.toFixed(2)}</p>
                        </div>
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Interés</p>
                            <p className="text-lg sm:text-xl font-semibold">{prestamo.interes}%</p>
                        </div>
                        {/* En el resumen del préstamo, modifica el campo de mora: */}
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Mora</p>
                            <p className="text-lg sm:text-xl font-semibold">
                                {pagos.some(p => p.estado === 'moroso') ? (
                                    `${prestamo.porcentaje_mora}% ${prestamo.tipo_mora} (Q${pagos
                                        .filter(p => !p.es_mora) // Excluir el pago de mora adicional
                                        .reduce((total, p) => total + (p.monto_mora || 0), 0)
                                        .toFixed(2)
                                    })`
                                ) : 'Sin mora'}
                            </p>
                        </div>
                        <div className="break-words">
                            <p className="text-gray-400 text-xs sm:text-sm">Total a pagar</p>
                            <p className="text-lg sm:text-xl font-semibold">
                                Q{(
                                    prestamo.monto * (1 + prestamo.interes / 100) +
                                    pagos
                                        .filter(p => !p.es_mora) // Excluir el pago de mora adicional
                                        .reduce((total, p) => total + (p.monto_mora || 0), 0)
                                ).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista de pagos - Versión móvil */}
                <div className="sm:hidden space-y-2">
                    {pagos.map((pago, index) => (
                        <div
                            key={index}
                            className={`bg-[#1f2d1b] rounded-lg p-3 ${pago.es_mora ? 'border-l-4 border-red-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium">
                                    {pago.es_mora ? 'Mora' : `Pago #${pago.numero}`}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${pago.estado === 'pagado' ? 'bg-green-900 text-green-300' :
                                    pago.estado === 'vencido' ? 'bg-red-900 text-red-300' :
                                        pago.estado === 'moroso' ? 'bg-purple-900 text-purple-300' :
                                            'bg-blue-900 text-blue-300'
                                    }`}>
                                    {pago.estado}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">

                                {new Date(pago.fecha).toLocaleDateString()}
                                {/* En la tabla, modifica la visualización de días de atraso: */}
                                {pago.dias_atraso && (
                                    <span className="block text-xs text-red-500">
                                        {prestamo.tipo_mora === 'diaria' ? `${pago.dias_atraso} días` :
                                            prestamo.tipo_mora === 'mensual' ? `${Math.ceil(pago.dias_atraso / 30)} meses` :
                                                `${Math.ceil(pago.dias_atraso / 365)} años`} de atraso
                                    </span>
                                )}

                                <div>
                                    <p className="text-gray-400">Monto</p>
                                    <p>Q{pago.monto.toFixed(2)}</p>
                                    {pago.monto_mora && (
                                            <span className="block text-xs text-red-500">
                                                +Q{pago.monto_mora.toFixed(2)} mora
                                            </span>
                                        )}
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <select
                                    value={pago.estado}
                                    onChange={(e) => cambiarEstadoPago(index, e.target.value as any)}
                                    className="w-full bg-gray-700 text-white p-1 rounded text-xs"
                                    
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="pagado">Pagado</option>
                                    {pago.es_mora && <option value="moroso">Moroso</option>}
                                </select>

                                {(
                                    <GenerarRecibo
                                        prestamoId={prestamo.id}
                                        prestamoData={{
                                            nombre: prestamo.nombre,
                                            dpi: prestamo.dpi,
                                            codigo_cliente: prestamo.codigo_cliente,
                                            monto: prestamo.monto,
                                            interes: prestamo.interes,
                                            porcentaje_mora: prestamo.porcentaje_mora,
                                            tipo_mora: prestamo.tipo_mora,
                                            fecha_inicio: prestamo.fecha_inicio
                                        }}
                                        pagoData={{
                                            numero: pago.numero,
                                            monto: pago.monto,
                                            monto_mora: pago.monto_mora,
                                            dias_atraso: pago.dias_atraso,
                                            esMora: pago.es_mora,
                                            fecha: pago.fecha,
                                            saldo_anterior: calcularSaldoAnterior(index, pagos, prestamo),
                                            saldo_restante: calcularSaldoRestante(index, pagos, prestamo)
                                        }}
                                        className="text-sm"
                                    />
                                )}
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
                                <tr
                                    key={index}
                                    className={`border-b border-gray-700 hover:bg-gray-700/50 ${pago.es_mora ? 'bg-purple-900/20' : ''}`}
                                >
                                    <td className="p-3 text-sm">
                                        {pago.numero}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {new Date(pago.fecha).toLocaleDateString()}
                                        {/* En la tabla, modifica la visualización de días de atraso: */}
                                        {pago.dias_atraso && (
                                            <span className="block text-xs text-red-500">
                                                {prestamo.tipo_mora === 'diaria' ? `${pago.dias_atraso} días` :
                                                    prestamo.tipo_mora === 'mensual' ? `${Math.ceil(pago.dias_atraso / 30)} meses` :
                                                        `${Math.ceil(pago.dias_atraso / 365)} años`} de atraso
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm">
                                        Q{pago.monto.toFixed(2)}
                                        {pago.monto_mora && (
                                            <span className="block text-xs text-red-500">
                                                +Q{pago.monto_mora.toFixed(2)} mora
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${pago.estado === 'pagado' ? 'bg-green-900 text-green-300' :
                                            pago.estado === 'vencido' ? 'bg-red-900 text-red-300' :
                                                pago.estado === 'moroso' ? 'bg-purple-900 text-purple-300' :
                                                    'bg-blue-900 text-blue-300'
                                            }`}>
                                            {pago.estado}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={pago.estado}
                                            onChange={(e) => cambiarEstadoPago(index, e.target.value as any)}
                                            className="bg-gray-700 text-white p-1 rounded text-sm"
                                            
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="pagado">Pagado</option>
                                            {pago.es_mora && <option value="moroso">Moroso</option>}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        {(
                                            <GenerarRecibo
                                                prestamoId={prestamo.id}
                                                prestamoData={{
                                                    nombre: prestamo.nombre,
                                                    dpi: prestamo.dpi,
                                                    codigo_cliente: prestamo.codigo_cliente,
                                                    monto: prestamo.monto,
                                                    interes: prestamo.interes,
                                                    porcentaje_mora: prestamo.porcentaje_mora,
                                                    tipo_mora: prestamo.tipo_mora,
                                                    fecha_inicio: prestamo.fecha_inicio
                                                }}
                                                pagoData={{
                                                    numero: pago.numero,
                                                    monto: pago.monto,
                                                    monto_mora: pago.monto_mora,
                                                    dias_atraso: pago.dias_atraso,
                                                    esMora: pago.es_mora,
                                                    fecha: pago.fecha,
                                                    saldo_anterior: calcularSaldoAnterior(index, pagos, prestamo),
                                                    saldo_restante: calcularSaldoRestante(index, pagos, prestamo)
                                                }}
                                                className="text-sm"
                                            />
                                        )}
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

// Función auxiliar para calcular saldo anterior
function calcularSaldoAnterior(index: number, pagos: Pago[], prestamo: Prestamo): number {
    if (index === 0) {
        return prestamo.tipo_interes === 'sobre_saldos'
            ? prestamo.monto
            : prestamo.monto * (1 + prestamo.interes / 100);
    }

    let saldo = prestamo.tipo_interes === 'sobre_saldos'
        ? prestamo.monto
        : prestamo.monto * (1 + prestamo.interes / 100);

    for (let i = 0; i < index; i++) {
        if (!pagos[i].es_mora) {
            saldo -= pagos[i].capital || (pagos[i].monto - (pagos[i].interes || 0));
        }
    }
    return parseFloat(saldo.toFixed(2));
}

function calcularSaldoRestante(index: number, pagos: Pago[], prestamo: Prestamo): number {
    let saldo = prestamo.tipo_interes === 'sobre_saldos'
        ? prestamo.monto
        : prestamo.monto * (1 + prestamo.interes / 100);

    for (let i = 0; i <= index; i++) {
        if (!pagos[i].es_mora) {
            saldo -= pagos[i].capital || (pagos[i].monto - (pagos[i].interes || 0));
        }
    }
    return parseFloat(Math.max(0, saldo).toFixed(2));
}
