import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, Plato, PedidoRequest, PedidoResponse } from '../models/pedido.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Clientes
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.api}/clientes`);
  }

  buscarCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.api}/clientes/${id}`);
  }

  registrarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.api}/clientes`, cliente);
  }

  // Platos
  listarPlatos(): Observable<Plato[]> {
    return this.http.get<Plato[]>(`${this.api}/platos`);
  }

  buscarPlato(id: number): Observable<Plato> {
    return this.http.get<Plato>(`${this.api}/platos/${id}`);
  }

  registrarPlato(plato: Plato): Observable<Plato> {
    return this.http.post<Plato>(`${this.api}/platos`, plato);
  }

  // Pedidos
  listarPedidos(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.api}/pedidos`);
  }

  registrarPedido(request: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${this.api}/pedidos`, request);
  }

  cancelarPedido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/pedidos/${id}`);
  }
}
