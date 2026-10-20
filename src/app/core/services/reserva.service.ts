import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservaRequest, ReservaResponse } from '../models/reserva.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reservas`;

  listarReservas(): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(this.apiUrl);
  }

  registrarReserva(request: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(this.apiUrl, request);
  }

  confirmarReserva(id: number): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  cancelarReserva(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}
