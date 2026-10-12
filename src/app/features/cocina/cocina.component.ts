import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../core/services/pedido.service';
import { PedidoResponse } from '../../core/models/pedido.models';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrl: './cocina.component.css'
})
export class CocinaComponent implements OnInit {
  private pedidoService = inject(PedidoService);

  pedidos = signal<PedidoResponse[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarComandas();
  }

  cargarComandas(): void {
    this.isLoading.set(true);
    this.pedidoService.listarPedidos().subscribe({
      next: (data) => {
        // En cocina se priorizan los pedidos no cancelados
        this.pedidos.set((data || []).filter(p => p.estado !== 'CANCELADO'));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  cambiarEstado(pedido: PedidoResponse, nuevoEstado: string): void {
    pedido.estado = nuevoEstado;
  }
}
