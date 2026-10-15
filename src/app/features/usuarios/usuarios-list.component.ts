import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioResponse, UsuarioRequest } from '../../core/models/usuario.models';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css'
})
export class UsuariosListComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);

  usuarios = signal<UsuarioResponse[]>([]);
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);

  // --- ESTADOS PARA EL MODAL DE CONFIRMACIÓN ESTILIZADO ---
  showConfirmModal = signal<boolean>(false);
  usuarioSeleccionado = signal<UsuarioResponse | null>(null);
  accionTipo = signal<'BAJA' | 'ACTIVAR'>('BAJA');

  // Variables de paginación (10 elementos)
  paginaActual = signal<number>(1);
  elementosPorPagina = 10;

  get usuariosPaginados(): UsuarioResponse[] {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.usuarios().slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuarios().length / this.elementosPorPagina) || 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  userForm: FormGroup = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    telefono: ['', Validators.required],
    rol: ['MOZO', Validators.required]
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data || []);
        this.paginaActual.set(1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.userForm.reset({ rol: 'MOZO' });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardarUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload: UsuarioRequest = this.userForm.value;
    this.usuarioService.registrar(payload).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err) => alert('Error al crear usuario: ' + (err.error?.message || err.message))
    });
  }

  // --- MÉTODOS PARA EL NUEVO MODAL DE CONFIRMACIÓN ---
  eliminarUsuario(u: UsuarioResponse): void {
    this.usuarioSeleccionado.set(u);
    this.accionTipo.set('BAJA');
    this.showConfirmModal.set(true);
  }

  activarUsuario(u: UsuarioResponse): void {
    this.usuarioSeleccionado.set(u);
    this.accionTipo.set('ACTIVAR');
    this.showConfirmModal.set(true);
  }

  cerrarConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.usuarioSeleccionado.set(null);
  }

  ejecutarAccionUsuario(): void {
    const u = this.usuarioSeleccionado();
    if (!u) return;

    if (this.accionTipo() === 'BAJA') {
      this.usuarioService.eliminar(u.idUsuario).subscribe({
        next: () => {
          this.cerrarConfirmModal();
          this.cargarUsuarios();
        },
        error: () => alert('Error al dar de baja al usuario.')
      });
    } else {
      this.usuarioService.activar(u.idUsuario).subscribe({
        next: () => {
          this.cerrarConfirmModal();
          this.cargarUsuarios();
        },
        error: () => alert('Error al activar el usuario.')
      });
    }
  }
}