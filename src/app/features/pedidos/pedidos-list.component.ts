import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../../core/services/pedido.service';
import { MesaService } from '../../core/services/mesa.service';
import { AuthService } from '../../core/services/auth.service';
import { PedidoResponse, Cliente, Plato, PedidoRequest, DetallePedidoRequest } from '../../core/models/pedido.models';
import { Mesa } from '../../core/models/mesa.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pedidos-list.component.html',
  styleUrl: './pedidos-list.component.css'
})
export class PedidosListComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private mesaService = inject(MesaService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  pedidos = signal<PedidoResponse[]>([]);
  clientes = signal<Cliente[]>([]);
  mesas = signal<Mesa[]>([]);
  platos = signal<Plato[]>([]);

  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  filtroEstado = signal<string>('TODOS');

  // Formulario de Pedido
  pedidoForm: FormGroup = this.fb.group({
    idCliente: [null, Validators.required],
    idMesa: [null, Validators.required],
    detalles: this.fb.array([])
  });

  get detallesArray(): FormArray {
    return this.pedidoForm.get('detalles') as FormArray;
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    forkJoin({
      pedidos: this.pedidoService.listarPedidos(),
      clientes: this.pedidoService.listarClientes(),
      mesas: this.mesaService.listar(),
      platos: this.pedidoService.listarPlatos()
    }).subscribe({
      next: ({ pedidos, clientes, mesas, platos }) => {
        this.pedidos.set(pedidos || []);
        this.clientes.set(clientes || []);
        this.mesas.set((mesas || []).filter(m => m.activo));
        this.platos.set((platos || []).filter(p => p.disponible));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get pedidosFiltrados(): PedidoResponse[] {
    const f = this.filtroEstado();
    if (f === 'TODOS') return this.pedidos();
    return this.pedidos().filter(p => p.estado === f);
  }

  abrirNuevoPedido(): void {
    this.detallesArray.clear();
    this.agregarItemDetalle(); // Agregar 1 plato por defecto
    this.pedidoForm.reset({
      idCliente: this.clientes().length > 0 ? this.clientes()[0].idcliente : null,
      idMesa: this.mesas().length > 0 ? this.mesas()[0].idMesa : null
    });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  agregarItemDetalle(): void {
    const itemGroup = this.fb.group({
      idPlato: [this.platos().length > 0 ? this.platos()[0].idPlato : null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.detallesArray.push(itemGroup);
  }

  eliminarItemDetalle(index: number): void {
    if (this.detallesArray.length > 1) {
      this.detallesArray.removeAt(index);
    }
  }

  calcularSubtotal(index: number): number {
    const item = this.detallesArray.at(index).value;
    const plato = this.platos().find(p => p.idPlato === Number(item.idPlato));
    return (plato?.precio || 0) * (Number(item.cantidad) || 0);
  }

  calcularTotalEstimado(): number {
    return this.detallesArray.controls.reduce((sum, _, idx) => sum + this.calcularSubtotal(idx), 0);
  }

  guardarPedido(): void {
    if (this.pedidoForm.invalid || this.detallesArray.length === 0) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUser();
    const idMozo = currentUser?.idUsuario || 1; // Fallback al id activo

    const raw = this.pedidoForm.value;
    const request: PedidoRequest = {
      idCliente: Number(raw.idCliente),
      idMozo: Number(idMozo),
      idMesa: Number(raw.idMesa),
      detalles: raw.detalles.map((d: any) => ({
        idPlato: Number(d.idPlato),
        cantidad: Number(d.cantidad)
      }))
    };

    this.pedidoService.registrarPedido(request).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => alert('Error al registrar pedido: ' + (err.error?.message || err.message))
    });
  }

  cancelarPedido(id: number): void {
    if (confirm(`¿Confirma cancelar el Pedido #${id}?`)) {
      this.pedidoService.cancelarPedido(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('No se puede cancelar el pedido: solo pedidos en estado REGISTRADO pueden anularse.')
      });
    }
  }
}
