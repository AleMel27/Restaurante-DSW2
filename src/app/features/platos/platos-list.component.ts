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

  platoForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [null, [Validators.required, Validators.min(0.1)]]
  });

  ngOnInit(): void {
    this.cargarPlatos();
  }

  cargarPlatos(): void {
    this.isLoading.set(true);
    this.pedidoService.listarPlatos().subscribe({
      next: (data) => {
        this.platos.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.platoForm.reset();
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarPlato(): void {
    if (this.platoForm.invalid) {
      this.platoForm.markAllAsTouched();
      return;
    }

    const payload: Plato = {
      ...this.platoForm.value,
      precio: Number(this.platoForm.value.precio),
      disponible: true
    };

    this.pedidoService.registrarPlato(payload).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarPlatos();
      },
      error: (err) => alert('Error al registrar plato: ' + (err.error?.message || err.message))
    });
  }
}
