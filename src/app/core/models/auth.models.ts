export type RolUsuario = 'ADMIN' | 'MOZO' | 'CHEF';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
  token: string;
}

export interface DecodedToken {
  sub: string;
  idUsuario: number;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}
