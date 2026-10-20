import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConsumoRequest, ConsumoResponse, Insumo, InsumoRequest, InsumoUpdateRequest,
  MovimientoRequest, MovimientoResponse, RecetaRequest, RecetaResponse
} from '../models/inventario.models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listarInsumos(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(`${this.apiUrl}/insumos`);
  }

  buscarInsumo(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.apiUrl}/insumos/${id}`);
  }

  listarBajoStock(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(`${this.apiUrl}/insumos/bajo-stock`);
  }

  crearInsumo(request: InsumoRequest): Observable<Insumo> {
    return this.http.post<Insumo>(`${this.apiUrl}/insumos`, request);
  }

  actualizarInsumo(id: number, request: InsumoUpdateRequest): Observable<Insumo> {
    return this.http.put<Insumo>(`${this.apiUrl}/insumos/${id}`, request);
  }

  listarMovimientos(): Observable<MovimientoResponse[]> {
    return this.http.get<MovimientoResponse[]>(`${this.apiUrl}/movimientos`);
  }

  registrarMovimiento(request: MovimientoRequest): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.apiUrl}/movimientos`, request);
  }

  listarReceta(idPlato: number): Observable<RecetaResponse[]> {
    return this.http.get<RecetaResponse[]>(`${this.apiUrl}/recetas/platos/${idPlato}`);
  }

  agregarIngrediente(request: RecetaRequest): Observable<RecetaResponse> {
    return this.http.post<RecetaResponse>(`${this.apiUrl}/recetas`, request);
  }

  eliminarIngrediente(idReceta: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/recetas/${idReceta}`);
  }

  registrarConsumo(request: ConsumoRequest): Observable<ConsumoResponse> {
    return this.http.post<ConsumoResponse>(`${this.apiUrl}/inventario/consumos`, request);
  }
}
