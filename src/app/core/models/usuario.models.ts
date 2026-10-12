import { RolUsuario } from './auth.models';

export interface UsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  password?: string;
  telefono: string;
  rol: RolUsuario;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
  activo: boolean;
}
