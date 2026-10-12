import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, DecodedToken, RolUsuario } from '../models/auth.models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'dsw2_resto_token';
const USER_KEY = 'dsw2_resto_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signal reactivo para el usuario autenticado
  readonly currentUser = signal<LoginResponse | null>(this.getStoredUser());

  // Señales computadas
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly currentRole = computed(() => this.currentUser()?.rol ?? null);
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.nombres} ${user.apellidos}` : '';
  });

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.saveSession(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(allowedRoles: RolUsuario | RolUsuario[]): boolean {
    const role = this.currentRole();
    if (!role) return false;

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role);
    }
    return allowedRoles === role;
  }

  private saveSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.currentUser.set(response);
  }

  private getStoredUser(): LoginResponse | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (!token || !userStr) return null;

      // Verificar si el token ha expirado
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      return JSON.parse(userStr) as LoginResponse;
    } catch {
      return null;
    }
  }

  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as DecodedToken;
    } catch {
      return null;
    }
  }
}
