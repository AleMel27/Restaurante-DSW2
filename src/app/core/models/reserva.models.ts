export interface ReservaResponse {
  idReserva: number;
  idMesa: number;
  numeroMesa: number;
  nombreCliente: string;
  telefono: string;
  fecha: string; // Formato yyyy-MM-dd
  hora: string;  // Formato HH:mm:ss
  cantidadPersonas: number;
  estado: string; // PENDIENTE, CONFIRMADA, CANCELADA
  fechaRegistro: string;
}

export interface ReservaRequest {
  idMesa: number;
  nombreCliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  cantidadPersonas: number;
}