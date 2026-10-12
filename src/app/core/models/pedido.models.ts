export interface Cliente {
  idcliente?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  correo?: string;
}

export interface Plato {
  idPlato?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponible: boolean;
}

export interface DetallePedidoRequest {
  idPlato: number;
  cantidad: number;
}

export interface PedidoRequest {
  idCliente: number;
  idMozo: number;
  idMesa: number;
  detalles: DetallePedidoRequest[];
}

export interface DetallePedidoResponse {
  idPlato: number;
  nombrePlato: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoResponse {
  idPedido: number;
  idCliente: number;
  nombreCliente: string;
  apellidoCliente: string;
  idMozo: number;
  nombreMozo: string;
  apellidoMozo: string;
  idMesa: number;
  NumeroMesa: number;
  fechaHoraRegistro: string;
  estado: string; // REGISTRADO, EN_PREPARACION, LISTO, CANCELADO
  total: number;
  detalles: DetallePedidoResponse[];
}
