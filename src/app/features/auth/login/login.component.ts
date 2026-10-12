import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Redirigir si ya está autenticado
  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Credenciales inválidas. Verifique su correo y contraseña.');
        } else if (err.status === 0) {
          this.errorMessage.set('No se pudo conectar con el microservicio de usuarios (:8081). Verifique que esté ejecutándose.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error al iniciar sesión. Inténtelo nuevamente.');
        }
      }
    });
  }

  // Atajos de prueba rápida — credenciales de la base de datos real (usuarios_db.sql)
  setQuickDemo(correo: string, pass: string): void {
    this.loginForm.patchValue({
      correo,
      password: pass
    });
  }
}
