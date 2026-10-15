import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../../core/services/pedido.service';
import { Cliente } from '../../core/models/pedido.models';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css'
})
export class ClientesListComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private fb = inject(FormBuilder);

  clientes = signal<Cliente[]>([]);
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);

  // --- VARIABLES DE PAGINACIÓN ---
  paginaActual = signal<number>(1);
  elementosPorPagina = 10;

  // Getter para obtener solo los clientes de la página actual
  get clientesPaginados(): Cliente[] {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.clientes().slice(inicio, fin);
  }

  // Getter para calcular el número total de páginas
  get totalPaginas(): number {
    return Math.ceil(this.clientes().length / this.elementosPorPagina) || 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  clienteForm: FormGroup = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    telefono: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.isLoading.set(true);
    this.pedidoService.listarClientes().subscribe({
      next: (data) => {
        this.clientes.set(data || []);
        this.paginaActual.set(1); // Reiniciar a la primera página al cargar
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.clienteForm.reset();
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const payload: Cliente = this.clienteForm.value;
    this.pedidoService.registrarCliente(payload).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarClientes();
      },
      error: (err) => alert('Error al registrar cliente: ' + (err.error?.message || err.message))
    });
  }
}