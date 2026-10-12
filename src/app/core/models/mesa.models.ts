export type EstadoMesa = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';

export interface Mesa {
  idMesa?: number;
  numero: number;
  capacidad: number;
  descripcion?: string;
  estado: EstadoMesa;
  activo?: boolean;
}
