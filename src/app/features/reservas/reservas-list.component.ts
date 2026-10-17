import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../core/services/reserva.service';
import { MesaService } from '../../core/services/mesa.service';
import { AuthService } from '../../core/services/auth.service';
import { ReservaResponse, ReservaRequest } from '../../core/models/reserva.models';
import { Mesa } from '../../core/models/mesa.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservas-list.component.html',
  styleUrl: './reservas-list.component.css'
})
export class ReservasListComponent implements OnInit {
  private reservaService = inject(ReservaService);
  private mesaService = inject(MesaService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  reservas = signal<ReservaResponse[]>([]);
  mesas = signal<Mesa[]>([]);

  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  filtroEstado = signal<string>('TODAS');

  reservaForm: FormGroup = this.fb.group({
    idMesa: [null, Validators.required],
    nombreCliente: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    cantidadPersonas: [2, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
  this.isLoading.set(true);
  forkJoin({
    reservas: this.reservaService.listarReservas(),
    mesas: this.mesaService.listar()
  }).subscribe({
    next: ({ reservas, mesas }) => {
      console.log('Mesas recibidas del microservicio:', mesas); // Revisa esto en la consola (F12)
      this.reservas.set(reservas || []);
      this.mesas.set(mesas || []); // Quitamos temporalmente el .filter(m => m.activo) para probar
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('Error al cargar mesas:', err);
      this.isLoading.set(false);
    }
  });
}

  get reservasFiltradas(): ReservaResponse[] {
    const f = this.filtroEstado();
    if (f === 'TODAS') return this.reservas();
    return this.reservas().filter(r => r.estado === f);
  }

  abrirNuevaReserva(): void {
    this.reservaForm.reset({
      idMesa: this.mesas().length > 0 ? this.mesas()[0].idMesa : null,
      nombreCliente: '',
      telefono: '',
      fecha: '',
      hora: '',
      cantidadPersonas: 2
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarReserva(): void {
    if (this.reservaForm.invalid) {
      this.reservaForm.markAllAsTouched();
      return;
    }

    const request: ReservaRequest = this.reservaForm.value;

    this.reservaService.registrarReserva(request).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => alert('Error al registrar la reserva: ' + (err.error?.message || err.message))
    });
  }

  confirmarReserva(id: number): void {
    this.reservaService.confirmarReserva(id).subscribe({
      next: () => this.cargarDatos(),
      error: () => alert('No se pudo confirmar la reserva.')
    });
  }

  cancelarReserva(id: number): void {
    if (confirm(`¿Confirma cancelar la Reserva #${id}?`)) {
      this.reservaService.cancelarReserva(id).subscribe({
        next: () => this.cargarDatos(),
        error: () => alert('No se pudo cancelar la reserva.')
      });
    }
  }
}