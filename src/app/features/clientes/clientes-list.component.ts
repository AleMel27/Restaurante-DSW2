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
