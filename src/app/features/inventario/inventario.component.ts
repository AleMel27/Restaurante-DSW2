import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Plato } from '../../core/models/pedido.models';
import {
  ConsumoResponse, Insumo, MovimientoResponse, RecetaResponse, TipoMovimiento
} from '../../core/models/inventario.models';
import { InventarioService } from '../../core/services/inventario.service';
import { PedidoService } from '../../core/services/pedido.service';

const textoRequerido = [Validators.required, Validators.pattern(/.*\S.*/)];
const decimalNoNegativo = [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,3})?$/)];
const decimalPositivo = [Validators.required, Validators.min(0.001), Validators.pattern(/^\d+(\.\d{1,3})?$/)];

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly pedidos = inject(PedidoService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly pestana = signal<'insumos' | 'movimientos' | 'recetas'>('insumos');
  readonly insumos = signal<Insumo[]>([]);
  readonly movimientos = signal<MovimientoResponse[]>([]);
  readonly platos = signal<Plato[]>([]);
  readonly receta = signal<RecetaResponse[]>([]);
  readonly cargandoInsumos = signal(true);
  readonly cargandoMovimientos = signal(true);
  readonly cargandoPlatos = signal(true);
  readonly cargandoReceta = signal(false);
  readonly errorInsumos = signal('');
  readonly errorMovimientos = signal('');
  readonly errorPlatos = signal('');
  readonly errorReceta = signal('');
  readonly aviso = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  readonly modal = signal<'insumo' | 'movimiento' | 'ingrediente' | 'consumo' | 'eliminar' | null>(null);
  readonly guardando = signal(false);
  readonly errorFormulario = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly ingredienteEliminar = signal<RecetaResponse | null>(null);
  readonly resultadoConsumo = signal<ConsumoResponse | null>(null);
  readonly busqueda = signal('');
  readonly filtroEstado = signal<'TODOS' | 'DISPONIBLE' | 'BAJO' | 'AGOTADO'>('TODOS');
  readonly platoId = signal<number | null>(null);

  // Configuración de Paginación
  readonly tamanoPagina = signal<number>(10);
  readonly paginaInsumos = signal<number>(1);
  readonly paginaMovimientos = signal<number>(1);

  readonly totalBajo = computed(() => this.insumos().filter(i => i.stockActual > 0 && i.stockActual <= i.stockMinimo).length);
  readonly totalAgotado = computed(() => this.insumos().filter(i => i.stockActual <= 0).length);
  
  readonly insumosFiltrados = computed(() => this.insumos().filter(i =>
    i.nombre.toLocaleLowerCase().includes(this.busqueda().trim().toLocaleLowerCase()) &&
    (this.filtroEstado() === 'TODOS' || this.estado(i) === this.filtroEstado())
  ));

  // Elementos paginados
  readonly totalPaginasInsumos = computed(() => Math.max(1, Math.ceil(this.insumosFiltrados().length / this.tamanoPagina())));
  readonly insumosPaginados = computed(() => {
    const inicio = (this.paginaInsumos() - 1) * this.tamanoPagina();
    return this.insumosFiltrados().slice(inicio, inicio + this.tamanoPagina());
  });

  readonly totalPaginasMovimientos = computed(() => Math.max(1, Math.ceil(this.movimientos().length / this.tamanoPagina())));
  readonly movimientosPaginados = computed(() => {
    const inicio = (this.paginaMovimientos() - 1) * this.tamanoPagina();
    return this.movimientos().slice(inicio, inicio + this.tamanoPagina());
  });

  readonly insumosActivos = computed(() => this.insumos().filter(i => i.activo));
  readonly insumosParaReceta = computed(() => this.insumosActivos().filter(i => !this.receta().some(r => r.idInsumo === i.idInsumo)));

  readonly insumoForm = this.fb.group({
    nombre: ['', textoRequerido],
    unidadMedida: ['', textoRequerido],
    stockMinimo: [0, decimalNoNegativo],
    activo: [true, Validators.required]
  });
  readonly movimientoForm = this.fb.group({
    idInsumo: [0, [Validators.required, Validators.min(1)]],
    tipo: ['ENTRADA' as TipoMovimiento, Validators.required],
    cantidad: [0, decimalPositivo],
    motivo: ['', textoRequerido]
  });
  readonly ingredienteForm = this.fb.group({
    idInsumo: [0, [Validators.required, Validators.min(1)]],
    cantidadPorPlato: [0, decimalPositivo]
  });
  readonly consumoForm = this.fb.group({
    cantidadPlatos: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
  });

  ngOnInit(): void {
    this.cargarInsumos();
    this.cargarMovimientos();
    this.cargarPlatos();
  }

  estado(insumo: Insumo): 'DISPONIBLE' | 'BAJO' | 'AGOTADO' {
    return insumo.stockActual <= 0 ? 'AGOTADO' : insumo.stockActual <= insumo.stockMinimo ? 'BAJO' : 'DISPONIBLE';
  }

  nombreInsumo(id: number): string {
    return this.insumos().find(i => i.idInsumo === id)?.nombre ?? `Insumo #${id}`;
  }

  platoSeleccionado(): Plato | undefined {
    return this.platos().find(p => p.idPlato === this.platoId());
  }

  cargarInsumos(): void {
    this.cargandoInsumos.set(true);
    this.errorInsumos.set('');
    this.inventario.listarInsumos().subscribe({
      next: data => { this.insumos.set(data); this.cargandoInsumos.set(false); },
      error: err => { this.errorInsumos.set(this.mensajeError(err)); this.cargandoInsumos.set(false); }
    });
  }

  cargarMovimientos(): void {
    this.cargandoMovimientos.set(true);
    this.errorMovimientos.set('');
    this.inventario.listarMovimientos().subscribe({
      next: data => { this.movimientos.set(data); this.cargandoMovimientos.set(false); },
      error: err => { this.errorMovimientos.set(this.mensajeError(err)); this.cargandoMovimientos.set(false); }
    });
  }

  cargarPlatos(): void {
    this.cargandoPlatos.set(true);
    this.errorPlatos.set('');
    this.pedidos.listarPlatos().subscribe({
      next: data => { this.platos.set(data); this.cargandoPlatos.set(false); },
      error: err => { this.errorPlatos.set(this.mensajeError(err)); this.cargandoPlatos.set(false); }
    });
  }

  seleccionarPlato(valor: string): void {
    const id = Number(valor);
    this.platoId.set(id > 0 ? id : null);
    this.receta.set([]);
    this.resultadoConsumo.set(null);
    this.errorReceta.set('');
    if (id <= 0) return;
    this.cargarReceta(id);
  }

  cambiarEstado(valor: string): void {
    if (valor === 'TODOS' || valor === 'DISPONIBLE' || valor === 'BAJO' || valor === 'AGOTADO') {
      this.filtroEstado.set(valor);
      this.paginaInsumos.set(1); 
    }
  }

  cargarReceta(id = this.platoId()): void {
    if (id === null) return;
    this.cargandoReceta.set(true);
    this.errorReceta.set('');
    this.inventario.listarReceta(id).subscribe({
      next: data => {
        if (this.platoId() === id) this.receta.set(data);
        this.cargandoReceta.set(false);
      },
      error: err => { this.errorReceta.set(this.mensajeError(err)); this.cargandoReceta.set(false); }
    });
  }

  abrirInsumo(insumo?: Insumo): void {
    this.editandoId.set(insumo?.idInsumo ?? null);
    this.insumoForm.reset({
      nombre: insumo?.nombre ?? '', unidadMedida: insumo?.unidadMedida ?? '',
      stockMinimo: insumo?.stockMinimo ?? 0, activo: insumo?.activo ?? true
    });
    this.abrirModal('insumo');
  }

  abrirModal(tipo: 'insumo' | 'movimiento' | 'ingrediente' | 'consumo' | 'eliminar'): void {
    this.errorFormulario.set('');
    if (tipo === 'movimiento') this.movimientoForm.reset({ idInsumo: 0, tipo: 'ENTRADA', cantidad: 0, motivo: '' });
    if (tipo === 'ingrediente') this.ingredienteForm.reset({ idInsumo: 0, cantidadPorPlato: 0 });
    if (tipo === 'consumo') this.consumoForm.reset({ cantidadPlatos: 1 });
    this.modal.set(tipo);
  }

  cerrarModal(): void {
    if (this.guardando()) return;
    this.modal.set(null);
    this.ingredienteEliminar.set(null);
    this.errorFormulario.set('');
  }

  guardarInsumo(): void {
    if (this.guardando()) return;
    if (this.insumoForm.invalid) { this.insumoForm.markAllAsTouched(); return; }
    const v = this.insumoForm.getRawValue();
    const id = this.editandoId();
    const peticion = id === null
      ? this.inventario.crearInsumo({ nombre: v.nombre.trim(), unidadMedida: v.unidadMedida.trim(), stockMinimo: Number(v.stockMinimo) })
      : this.inventario.actualizarInsumo(id, { nombre: v.nombre.trim(), stockMinimo: Number(v.stockMinimo), activo: v.activo });
    this.guardando.set(true);
    peticion.subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.exito(id === null ? 'Insumo registrado.' : 'Insumo actualizado.'); this.cargarInsumos(); },
      error: err => this.fallo(err)
    });
  }

  guardarMovimiento(): void {
    if (this.guardando()) return;
    if (this.movimientoForm.invalid) { this.movimientoForm.markAllAsTouched(); return; }
    const v = this.movimientoForm.getRawValue();
    if (!this.insumosActivos().some(i => i.idInsumo === Number(v.idInsumo))) {
      this.errorFormulario.set('Selecciona un insumo activo.'); return;
    }
    this.guardando.set(true);
    this.inventario.registrarMovimiento({ idInsumo: Number(v.idInsumo), tipo: v.tipo, cantidad: Number(v.cantidad), motivo: v.motivo.trim() }).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.exito('Movimiento registrado.'); this.cargarInsumos(); this.cargarMovimientos(); },
      error: err => this.fallo(err)
    });
  }

  guardarIngrediente(): void {
    const idPlato = this.platoId();
    if (this.guardando() || idPlato === null) return;
    if (this.ingredienteForm.invalid) { this.ingredienteForm.markAllAsTouched(); return; }
    const v = this.ingredienteForm.getRawValue();
    if (!this.insumosParaReceta().some(i => i.idInsumo === Number(v.idInsumo))) {
      this.errorFormulario.set('Selecciona un insumo disponible que no esté en la receta.'); return;
    }
    this.guardando.set(true);
    this.inventario.agregarIngrediente({ idPlato, idInsumo: Number(v.idInsumo), cantidadPorPlato: Number(v.cantidadPorPlato) }).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.exito('Ingrediente agregado.'); this.cargarReceta(idPlato); },
      error: err => this.fallo(err)
    });
  }

  confirmarEliminar(ingrediente: RecetaResponse): void {
    this.ingredienteEliminar.set(ingrediente);
    this.abrirModal('eliminar');
  }

  eliminarIngrediente(): void {
    const ingrediente = this.ingredienteEliminar();
    if (this.guardando() || !ingrediente) return;
    this.guardando.set(true);
    this.inventario.eliminarIngrediente(ingrediente.idReceta).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.exito('Ingrediente eliminado.'); this.cargarReceta(); },
      error: err => this.fallo(err)
    });
  }

  consumir(): void {
    const idPlato = this.platoId();
    if (this.guardando() || idPlato === null || this.receta().length === 0) return;
    if (this.consumoForm.invalid) { this.consumoForm.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.inventario.registrarConsumo({ idPlato, cantidadPlatos: Number(this.consumoForm.getRawValue().cantidadPlatos) }).subscribe({
      next: resultado => {
        this.guardando.set(false); this.cerrarModal(); this.resultadoConsumo.set(resultado);
        this.exito(`Consumo confirmado: ${resultado.movimientos.length} movimiento(s) registrado(s).`);
        this.cargarInsumos(); this.cargarMovimientos();
      },
      error: err => this.fallo(err)
    });
  }

  private fallo(err: HttpErrorResponse): void {
    this.guardando.set(false);
    this.errorFormulario.set(this.mensajeError(err));
  }

  private exito(texto: string): void {
    this.aviso.set({ tipo: 'success', texto });
  }

  mensajeError(err: HttpErrorResponse): string {
    const cuerpo = err.error;
    const detalle = typeof cuerpo === 'object' && cuerpo !== null
      ? [cuerpo.error, cuerpo.message, cuerpo.detail].find(v => typeof v === 'string' && v.trim())
      : typeof cuerpo === 'string' && !cuerpo.includes('<html') ? cuerpo : undefined;
    const explicacion = typeof detalle === 'string' ? `: ${detalle}` : '';
    const estados: Record<number, string> = {
      0: 'No se pudo conectar con el Gateway', 400: 'Datos inválidos', 401: 'Sesión expirada',
      403: 'Acceso no autorizado', 404: 'Recurso no encontrado', 409: 'Conflicto de inventario',
      500: 'Error interno', 502: 'Gateway no disponible', 503: 'Servicio no disponible'
    };
    return `${estados[err.status] ?? 'Error de solicitud'} (HTTP ${err.status})${explicacion}`;
  }
}