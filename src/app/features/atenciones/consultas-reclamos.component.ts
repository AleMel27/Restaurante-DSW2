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
