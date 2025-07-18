// app/types.ts
export interface Pago {
    numero: number;
    fecha: string;
    monto: number;
    capital: number;
    interes: number;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'moroso';
    id: string;
    es_mora?: boolean;
    fecha_pago?: string | null;
    dias_atraso?: number;
    monto_mora?: number;
    prestamo_id: string;
}

export interface Prestamo {
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
    porcentaje_mora: number;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'moroso';
    tipo_mora: 'diaria' | 'mensual' | 'anual';
    monto_mora: number;
    mora_aplicada: boolean;
    tipo_interes: 'fijo' | 'sobre_saldos';
}