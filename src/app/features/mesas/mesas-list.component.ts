import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MesaService } from '../../core/services/mesa.service';
import { AuthService } from '../../core/services/auth.service';
import { Mesa, EstadoMesa } from '../../core/models/mesa.models';

@Component({
  selector: 'app-mesas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mesas-list.component.html',
  styleUrl: './mesas-list.component.css'
})
export class MesasListComponent implements OnInit {
  private mesaService = inject(MesaService);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  mesas = signal<Mesa[]>([]);
  filtroEstado = signal<string>('TODAS');
  isLoading = signal<boolean>(true);
  errorMsg = signal<string | null>(null);

  // Modal State
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  mesaForm: FormGroup = this.fb.group({
    numero: [null, [Validators.required, Validators.min(1)]],
    capacidad: [4, [Validators.required, Validators.min(1)]],
    descripcion: ['Mesa de salón'],
    estado: ['DISPONIBLE', Validators.required]
  });

  ngOnInit(): void {
    this.cargarMesas();
  }

  cargarMesas(): void {
    this.isLoading.set(true);
    this.mesaService.listar().subscribe({
      next: (data) => {
        this.mesas.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('No se pudo conectar con el microservicio de mesas (:8084).');
        this.isLoading.set(false);
      }
    });
  }

  get mesasFiltradas(): Mesa[] {
    const filtro = this.filtroEstado();
    if (filtro === 'TODAS') {
      return this.mesas();
    }
    return this.mesas().filter(m => m.estado === filtro);
  }

  abrirCrear(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.mesaForm.reset({
      numero: this.mesas().length + 1,
      capacidad: 4,
      descripcion: 'Mesa de salón',
      estado: 'DISPONIBLE'
    });
    this.showModal.set(true);
  }

  abrirEditar(mesa: Mesa): void {
    if (!mesa.idMesa) return;
    this.isEditing.set(true);
    this.editingId.set(mesa.idMesa);
    this.mesaForm.patchValue({
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      descripcion: mesa.descripcion,
      estado: mesa.estado
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarMesa(): void {
    if (this.mesaForm.invalid) {
      this.mesaForm.markAllAsTouched();
      return;
    }

    const payload: Mesa = this.mesaForm.value;

    if (this.isEditing()) {
      const id = this.editingId()!;
      this.mesaService.actualizar(id, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarMesas();
        },
        error: (err) => alert('Error al actualizar la mesa: ' + (err.error?.message || err.message))
      });
    } else {
      this.mesaService.registrar(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarMesas();
        },
        error: (err) => alert('Error al crear la mesa: ' + (err.error?.message || err.message))
      });
    }
  }

  eliminarMesa(mesa: Mesa): void {
    if (!mesa.idMesa) return;
    if (confirm(`¿Confirma dar de baja lógica a la Mesa #${mesa.numero}?`)) {
      this.mesaService.eliminar(mesa.idMesa).subscribe({
        next: () => this.cargarMesas(),
        error: (err) => alert('Error al eliminar la mesa.')
      });
    }
  }
}
