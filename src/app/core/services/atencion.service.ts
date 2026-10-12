import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Atencion,
  AtencionRequest,
  Consulta,
  ConsultaRequest,
  Reclamo,
  ReclamoRequest,
  RespuestaAccionRequest
} from '../models/atencion.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtencionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Atenciones
  listarAtenciones(): Observable<Atencion[]> {
    return this.http.get<Atencion[]>(`${this.api}/atenciones`);
  }

  buscarAtencion(id: number): Observable<Atencion> {
    return this.http.get<Atencion>(`${this.api}/atenciones/${id}`);
  }

  registrarAtencion(request: AtencionRequest): Observable<Atencion> {
    return this.http.post<Atencion>(`${this.api}/atenciones`, request);
  }

  cambiarEstadoAtencion(id: number, estado: string): Observable<Atencion> {
    return this.http.patch<Atencion>(`${this.api}/atenciones/${id}/estado?estado=${encodeURIComponent(estado)}`, {});
  }

  // Consultas
  listarConsultas(): Observable<Consulta[]> {
    return this.http.get<Consulta[]>(`${this.api}/consultas`);
  }

  buscarConsulta(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.api}/consultas/${id}`);
  }

  registrarConsulta(request: ConsultaRequest): Observable<Consulta> {
    return this.http.post<Consulta>(`${this.api}/consultas`, request);
  }

  responderConsulta(id: number, respuesta: string): Observable<Consulta> {
    const payload: RespuestaAccionRequest = { respuesta };
    return this.http.patch<Consulta>(`${this.api}/consultas/${id}/responder`, payload);
  }

  // Reclamos
  listarReclamos(): Observable<Reclamo[]> {
    return this.http.get<Reclamo[]>(`${this.api}/reclamos`);
  }

  buscarReclamo(id: number): Observable<Reclamo> {
    return this.http.get<Reclamo>(`${this.api}/reclamos/${id}`);
  }

  registrarReclamo(request: ReclamoRequest): Observable<Reclamo> {
    return this.http.post<Reclamo>(`${this.api}/reclamos`, request);
  }

  resolverReclamo(id: number, respuesta: string): Observable<Reclamo> {
    const payload: RespuestaAccionRequest = { respuesta };
    return this.http.patch<Reclamo>(`${this.api}/reclamos/${id}/resolver`, payload);
  }
}
