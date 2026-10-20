// Contratos de inventario-service: BigDecimal se serializa como número JSON.
export interface Insumo {
  idInsumo: number;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export interface InsumoRequest {
  nombre: string;
  unidadMedida: string;
  stockMinimo: number;
}

export interface InsumoUpdateRequest {
  nombre: string;
  stockMinimo: number;
  activo: boolean;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface MovimientoRequest {
  idInsumo: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
}

export interface MovimientoResponse extends MovimientoRequest {
  idMovimiento: number;
  fecha: string;
}

export interface RecetaRequest {
  idPlato: number;
  idInsumo: number;
  cantidadPorPlato: number;
}

export interface RecetaResponse extends RecetaRequest {
  idReceta: number;
  nombreInsumo: string;
  unidadMedida: string;
}

export interface ConsumoRequest {
  idPlato: number;
  cantidadPlatos: number;
}

export interface ConsumoResponse extends ConsumoRequest {
  movimientos: MovimientoResponse[];
}
