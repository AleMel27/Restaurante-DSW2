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
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  abrirCrear(): void {
    this.userForm.reset({
      rol: 'MOZO'
    });
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

  eliminarUsuario(u: UsuarioResponse): void {
    if (confirm(`¿Confirma dar de baja al usuario ${u.nombres} ${u.apellidos}?`)) {
      this.usuarioService.eliminar(u.idUsuario).subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => alert('Error al dar de baja al usuario.')
      });
    }
  }
}
