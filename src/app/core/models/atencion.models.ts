export type EstadoAtencion = 'PENDIENTE' | 'EN_ATENCION' | 'FINALIZADA' | 'CANCELADA';
export type EstadoConsulta = 'PENDIENTE' | 'EN_PROCESO' | 'RESPONDIDA' | 'CERRADA';
export type EstadoReclamo = 'ABIERTO' | 'EN_REVISION' | 'RESUELTO' | 'CERRADO';
export type PrioridadReclamo = 'BAJA' | 'MEDIA' | 'ALTA';

export interface Atencion {
  idAtencion?: number;
  idCliente: number;
  idMozo: number;
  idMesa: number;
  descripcion: string;
  estado: EstadoAtencion;
  fechaRegistro?: string;
  fechaFinalizacion?: string;
}

export interface AtencionRequest {
  idCliente: number;
  idMozo: number;
  idMesa: number;
  descripcion: string;
}

export interface Consulta {
  idConsulta?: number;
  idCliente: number;
  asunto: string;
  descripcion: string;
  estado: EstadoConsulta;
  respuesta?: string;
  fechaRegistro?: string;
  fechaRespuesta?: string;
}

export interface ConsultaRequest {
  idCliente: number;
  asunto: string;
  descripcion: string;
}

export interface Reclamo {
  idReclamo?: number;
  idCliente: number;
  idAtencion?: number;
  motivo: string;
  descripcion: string;
  prioridad: PrioridadReclamo;
  estado: EstadoReclamo;
  respuesta?: string;
  fechaRegistro?: string;
  fechaResolucion?: string;
}

export interface ReclamoRequest {
  idCliente: number;
  idAtencion?: number;
  motivo: string;
  descripcion: string;
}

export interface RespuestaAccionRequest {
  respuesta: string;
}
