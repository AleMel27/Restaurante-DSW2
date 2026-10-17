import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/mesa.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AtencionService } from '../../core/services/atencion.service';
import { ReservaService } from '../../core/services/reserva.service'; // Importar servicio de reservas
import { Mesa } from '../../core/models/mesa.models';
import { PedidoResponse } from '../../core/models/pedido.models';
import { ReservaResponse } from '../../core/models/reserva.models'; // Importar modelo de reservas
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
  private reservaService = inject(ReservaService); // Inyectar ReservaService

  currentUserName = this.authService.currentUserName;
  currentRole = this.authService.currentRole;

  totalMesas = signal<number>(0);
  mesasDisponibles = signal<number>(0);
  mesasOcupadas = signal<number>(0);

  totalPedidos = signal<number>(0);
  montoTotal = signal<number>(0);
  pedidosActivos = signal<PedidoResponse[]>([]);

  // Señales de Reservas
  totalReservas = signal<number>(0);
  reservasPendientes = signal<number>(0);
  reservasActivas = signal<ReservaResponse[]>([]);

  totalAtenciones = signal<number>(0);
  totalReclamosAbiertos = signal<number>(0);
  totalConsultas = signal<number>(0);

  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.isLoading.set(true);

    // Ejecución segura incluyendo el listado de reservas del microservicio :8085
    forkJoin({
      mesas: this.mesaService.listar().pipe(catchError(() => of([]))),
      pedidos: this.pedidoService.listarPedidos().pipe(catchError(() => of([]))),
      reservas: this.reservaService.listarReservas().pipe(catchError(() => of([]))),
      atenciones: this.atencionService.listarAtenciones().pipe(catchError(() => of([]))),
      reclamos: this.atencionService.listarReclamos().pipe(catchError(() => of([]))),
      consultas: this.atencionService.listarConsultas().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ mesas, pedidos, reservas, atenciones, reclamos, consultas }) => {
        // Métricas de Mesas
        if (mesas && Array.isArray(mesas)) {
          this.totalMesas.set(mesas.length);
          this.mesasDisponibles.set(mesas.filter(m => m.estado === 'DISPONIBLE').length);
          this.mesasOcupadas.set(mesas.filter(m => m.estado === 'OCUPADA').length);
        }

        // Métricas de Pedidos
        if (pedidos && Array.isArray(pedidos)) {
          this.totalPedidos.set(pedidos.length);
          this.pedidosActivos.set(pedidos.slice(0, 5));
          const total = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
          this.montoTotal.set(total);
        }

        // Métricas de Reservas
        if (reservas && Array.isArray(reservas)) {
          this.totalReservas.set(reservas.length);
          this.reservasPendientes.set(reservas.filter(r => r.estado === 'PENDIENTE').length);
          this.reservasActivas.set(reservas.slice(0, 5)); // últimas 5 reservas
        }

        // Métricas de Atenciones, Reclamos y Consultas
        if (atenciones && Array.isArray(atenciones)) {
          this.totalAtenciones.set(atenciones.filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_ATENCION').length);
        }
        if (reclamos && Array.isArray(reclamos)) {
          this.totalReclamosAbiertos.set(reclamos.filter(r => r.estado === 'ABIERTO' || r.estado === 'EN_REVISION').length);
        }
        if (consultas && Array.isArray(consultas)) {
          this.totalConsultas.set(consultas.length);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}