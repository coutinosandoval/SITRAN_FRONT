import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  // Importamos ActivatedRoute para leer el token de la URL
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  // Token que viene en la URL (?token=abc123)
  token: string = '';

  // Campos del formulario
  nuevaClave:     string = '';
  confirmarClave: string = '';

  // Mensajes de estado
  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;
  tokenInvalido: boolean = false;

  constructor(
    private http:  HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr:   ChangeDetectorRef
  ) {}

  // Al iniciar el componente, lee el token de la URL
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.tokenInvalido = true;
    }
  }

  // Método que envía la nueva contraseña al backend
  cambiarClave(): void {
    if (!this.nuevaClave || !this.confirmarClave) {
      this.mensajeError = 'Todos los campos son requeridos.';
      return;
    }
    if (this.nuevaClave !== this.confirmarClave) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.nuevaClave.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando     = true;
    this.mensajeError = '';

    // POST al endpoint de restablecimiento con el token y la nueva clave
    this.http.post<any>(
      `${environment.apiUrl}/api/auth/reset-password`,
      { token: this.token, nuevaClave: this.nuevaClave }
    ).subscribe({
      next: (res) => {
        this.mensajeExito = res.mensaje;
        this.cargando     = false;
        this.cdr.detectChanges();
        // Redirige al login después de 3 segundos
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'El enlace no es válido o ha expirado.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }
}
