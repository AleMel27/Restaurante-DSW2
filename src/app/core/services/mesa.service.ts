import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesa } from '../models/mesa.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/mesas`;

  listar(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(this.baseUrl);
  }

  buscarPorId(id: number): Observable<Mesa> {
    return this.http.get<Mesa>(`${this.baseUrl}/${id}`);
  }

  registrar(mesa: Mesa): Observable<Mesa> {
    return this.http.post<Mesa>(this.baseUrl, mesa);
  }

  actualizar(id: number, mesa: Mesa): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.baseUrl}/${id}`, mesa);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
