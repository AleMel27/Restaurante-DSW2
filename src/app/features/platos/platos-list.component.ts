import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';
import { Plato } from '../../core/models/pedido.models';

@Component({
  selector: 'app-platos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './platos-list.component.html',
  styleUrl: './platos-list.component.css'
})
export class PlatosListComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  platos = signal<Plato[]>([]);
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  editandoId = signal<number | null>(null);

  // --- VARIABLES DE PAGINACIÓN
  paginaActual = signal<number>(1);
  elementosPorPagina = 9;

  // Getter que filtra por rol/disponibilidad y aplica la paginación
  get platosPaginados(): Plato[] {
    const lista = this.platos();
    const esAdmin = this.authService.hasRole(['ADMIN']);
    
    // Filtro previo según permisos de rol
    const filtrados = esAdmin ? lista : lista.filter(p => p.disponible);
    
    // Corte por página de 10 en 10
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return filtrados.slice(inicio, fin);
  }

  // Getter para calcular el total de páginas según el filtro actual
  get totalPaginas(): number {
    const lista = this.platos();
    const esAdmin = this.authService.hasRole(['ADMIN']);
    const filtrados = esAdmin ? lista : lista.filter(p => p.disponible);
    return Math.ceil(filtrados.length / this.elementosPorPagina) || 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  platoForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [null, [Validators.required, Validators.min(0.1)]],
    disponible: [true, Validators.required]
  });

  ngOnInit(): void {
    this.cargarPlatos();
  }

  cargarPlatos(): void {
    this.isLoading.set(true);
    this.pedidoService.listarPlatos().subscribe({
      next: (data) => {
        this.platos.set(data || []);
        this.paginaActual.set(1); // Reiniciar a la primera página al refrescar
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.platoForm.reset({
      disponible: true
    });
    this.showModal.set(true);
  }

  abrirEditar(plato: Plato): void {
    this.editandoId.set(plato.idPlato!);
    this.platoForm.patchValue({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      disponible: plato.disponible
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.editandoId.set(null);
  }

  guardarPlato(): void {
    if (this.platoForm.invalid) {
      this.platoForm.markAllAsTouched();
      return;
    }

    const payload: Plato = {
      ...this.platoForm.value,
      precio: Number(this.platoForm.value.precio)
    };

    const id = this.editandoId();

    if (id !== null) {
      this.pedidoService.actualizarPlato(id, payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarPlatos();
        },
        error: (err) => alert('Error al actualizar el plato: ' + (err.error?.message || err.message))
      });
    } else {
      this.pedidoService.registrarPlato(payload).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarPlatos();
        },
        error: (err) => alert('Error al registrar plato: ' + (err.error?.message || err.message))
      });
    }
  }
}