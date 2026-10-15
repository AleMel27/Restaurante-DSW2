import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AtencionService } from '../../core/services/atencion.service';
import { Consulta, Reclamo } from '../../core/models/atencion.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-consultas-reclamos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultas-reclamos.component.html',
  styleUrl: './consultas-reclamos.component.css'
})
export class ConsultasReclamosComponent implements OnInit {
  private atencionService = inject(AtencionService);
  private fb = inject(FormBuilder);

  tabActivo = signal<'CONSULTAS' | 'RECLAMOS'>('RECLAMOS');

  consultas = signal<Consulta[]>([]);
  reclamos = signal<Reclamo[]>([]);
  isLoading = signal<boolean>(true);

  // --- VARIABLES DE PAGINACIÓN (10 elementos) ---
  elementosPorPagina = 10;
  paginaActualReclamos = signal<number>(1);
  paginaActualConsultas = signal<number>(1);

  // Getters de paginación para Reclamos
  get reclamosPaginados(): Reclamo[] {
    const inicio = (this.paginaActualReclamos() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.reclamos().slice(inicio, fin);
  }

  get totalPaginasReclamos(): number {
    return Math.ceil(this.reclamos().length / this.elementosPorPagina) || 1;
  }

  cambiarPaginaReclamos(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasReclamos) {
      this.paginaActualReclamos.set(pagina);
    }
  }

  // Getters de paginación para Consultas
  get consultasPaginadas(): Consulta[] {
    const inicio = (this.paginaActualConsultas() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.consultas().slice(inicio, fin);
  }

  get totalPaginasConsultas(): number {
    return Math.ceil(this.consultas().length / this.elementosPorPagina) || 1;
  }

  cambiarPaginaConsultas(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasConsultas) {
      this.paginaActualConsultas.set(pagina);
    }
  }

  // Modal para responder
  showModal = signal<boolean>(false);
  modalTipo = signal<'CONSULTA' | 'RECLAMO'>('RECLAMO');
  selectedId = signal<number | null>(null);

  respuestaForm: FormGroup = this.fb.group({
    respuesta: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    forkJoin({
      consultas: this.atencionService.listarConsultas(),
      reclamos: this.atencionService.listarReclamos()
    }).subscribe({
      next: ({ consultas, reclamos }) => {
        this.consultas.set(consultas || []);
        this.reclamos.set(reclamos || []);
        this.paginaActualReclamos.set(1);
        this.paginaActualConsultas.set(1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirResponderConsulta(c: Consulta): void {
    if (!c.idConsulta) return;
    this.modalTipo.set('CONSULTA');
    this.selectedId.set(c.idConsulta);
    this.respuestaForm.reset({ respuesta: c.respuesta || '' });
    this.showModal.set(true);
  }

  abrirResolverReclamo(r: Reclamo): void {
    if (!r.idReclamo) return;
    this.modalTipo.set('RECLAMO');
    this.selectedId.set(r.idReclamo);
    this.respuestaForm.reset({ respuesta: r.respuesta || '' });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.selectedId.set(null);
  }

  enviarRespuesta(): void {
    if (this.respuestaForm.invalid || !this.selectedId()) {
      this.respuestaForm.markAllAsTouched();
      return;
    }

    const resp = this.respuestaForm.value.respuesta;
    const id = this.selectedId()!;

    if (this.modalTipo() === 'CONSULTA') {
      this.atencionService.responderConsulta(id, resp).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (err) => alert('Error al responder consulta: ' + (err.error?.message || err.message))
      });
    } else {
      this.atencionService.resolverReclamo(id, resp).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (err) => alert('Error al resolver reclamo: ' + (err.error?.message || err.message))
      });
    }
  }
}