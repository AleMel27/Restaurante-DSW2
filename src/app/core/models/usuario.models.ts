import { RolUsuario } from './auth.models';
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
}

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
