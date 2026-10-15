import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AtencionService } from '../../core/services/atencion.service';
import { PedidoService } from '../../core/services/pedido.service';
import { MesaService } from '../../core/services/mesa.service';
import { AuthService } from '../../core/services/auth.service';
import { Atencion, AtencionRequest } from '../../core/models/atencion.models';
import { Cliente } from '../../core/models/pedido.models';
import { Mesa } from '../../core/models/mesa.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-atenciones-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './atenciones-list.component.html',
  styleUrl: './atenciones-list.component.css'
})
export class AtencionesListComponent implements OnInit {
  private atencionService = inject(AtencionService);
  private pedidoService = inject(PedidoService);
  private mesaService = inject(MesaService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  atenciones = signal<Atencion[]>([]);
  clientes = signal<Cliente[]>([]);
  mesas = signal<Mesa[]>([]);

  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);

  // --- VARIABLES DE PAGINACIÓN (10 elementos) ---
  paginaActual = signal<number>(1);
  elementosPorPagina = 10;

  // Getter para obtener solo las atenciones de la página actual
  get atencionesPaginadas(): Atencion[] {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.atenciones().slice(inicio, fin);
  }

  // Getter para calcular el número total de páginas
  get totalPaginas(): number {
    return Math.ceil(this.atenciones().length / this.elementosPorPagina) || 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  atencionForm: FormGroup = this.fb.group({
    idCliente: [null, Validators.required],
    idMesa: [null, Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    forkJoin({
      atenciones: this.atencionService.listarAtenciones(),
      clientes: this.pedidoService.listarClientes(),
      mesas: this.mesaService.listar()
    }).subscribe({
      next: ({ atenciones, clientes, mesas }) => {
        this.atenciones.set(atenciones || []);
        this.clientes.set(clientes || []);
        this.mesas.set(mesas || []);
        this.paginaActual.set(1); // Reiniciar a la primera página
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.atencionForm.reset({
      idCliente: this.clientes().length > 0 ? this.clientes()[0].idcliente : null,
      idMesa: this.mesas().length > 0 ? this.mesas()[0].idMesa : null
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarAtencion(): void {
    if (this.atencionForm.invalid) {
      this.atencionForm.markAllAsTouched();
      return;
    }

    const currentUserId = this.authService.currentUser()?.idUsuario || 1;
    const raw = this.atencionForm.value;
    const request: AtencionRequest = {
      idCliente: Number(raw.idCliente),
      idMozo: Number(currentUserId),
      idMesa: Number(raw.idMesa),
      descripcion: raw.descripcion
    };

    this.atencionService.registrarAtencion(request).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => alert('Error al registrar atención: ' + (err.error?.message || err.message))
    });
  }

  cambiarEstado(atencion: Atencion, estado: string): void {
    if (!atencion.idAtencion) return;
    this.atencionService.cambiarEstadoAtencion(atencion.idAtencion, estado).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => alert('Error al actualizar estado: ' + (err.error?.message || err.message))
    });
  }
}