import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/mesa.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AtencionService } from '../../core/services/atencion.service';
import { Mesa } from '../../core/models/mesa.models';
import { PedidoResponse } from '../../core/models/pedido.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private mesaService = inject(MesaService);
  private pedidoService = inject(PedidoService);
  private atencionService = inject(AtencionService);

  currentUserName = this.authService.currentUserName;
  currentRole = this.authService.currentRole;

  totalMesas = signal<number>(0);
  mesasDisponibles = signal<number>(0);
  mesasOcupadas = signal<number>(0);

  totalPedidos = signal<number>(0);
  montoTotal = signal<number>(0);
  pedidosActivos = signal<PedidoResponse[]>([]);

  totalAtenciones = signal<number>(0);
  totalReclamosAbiertos = signal<number>(0);

  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.isLoading.set(true);

    // Ejecución segura de microservicios en paralelo con aislamiento de errores
    forkJoin({
      mesas: this.mesaService.listar().pipe(catchError(() => of([]))),
      pedidos: this.pedidoService.listarPedidos().pipe(catchError(() => of([]))),
      atenciones: this.atencionService.listarAtenciones().pipe(catchError(() => of([]))),
      reclamos: this.atencionService.listarReclamos().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ mesas, pedidos, atenciones, reclamos }) => {
        // Métricas de Mesas
        if (mesas && Array.isArray(mesas)) {
          this.totalMesas.set(mesas.length);
          this.mesasDisponibles.set(mesas.filter(m => m.estado === 'DISPONIBLE').length);
          this.mesasOcupadas.set(mesas.filter(m => m.estado === 'OCUPADA').length);
        }

        // Métricas de Pedidos
        if (pedidos && Array.isArray(pedidos)) {
          this.totalPedidos.set(pedidos.length);
          this.pedidosActivos.set(pedidos.slice(0, 5)); // últimos 5
          const total = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
          this.montoTotal.set(total);
        }

        // Métricas de Atenciones y Reclamos
        if (atenciones && Array.isArray(atenciones)) {
          this.totalAtenciones.set(atenciones.filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_ATENCION').length);
        }
        if (reclamos && Array.isArray(reclamos)) {
          this.totalReclamosAbiertos.set(reclamos.filter(r => r.estado === 'ABIERTO' || r.estado === 'EN_REVISION').length);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}