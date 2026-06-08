import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { LoginRequest } from '../modelos/auth.model';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
 
})
export class LoginComponent {

  // Modelo que se enlaza con el formulario HTML
  request: LoginRequest = {
    usuario: '',
    clave: ''
  };

  irARegistro(): void {
  this.router.navigate(['/registro']);
}

  // Mensaje de error para mostrar al usuario
  mensajeError: string = '';

  // Mensaje de bloqueo cuando supera intentos fallidos
  mensajeBloqueado: string = '';

  // Controla el spinner del botón mientras espera respuesta del API
  cargando: boolean = false;

  // Contador de intentos fallidos para bloqueo temporal en frontend
  intentosFallidos: number = 0;

  // Máximo de intentos antes de bloqueo temporal
  readonly maxIntentos: number = 3;

  // Año actual para el footer
  anioActual: number = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Método que se ejecuta al hacer click en el botón Ingresar
  iniciarSesion(): void {

    // Limpiar mensajes anteriores
    this.mensajeError = '';
    this.mensajeBloqueado = '';

    // Validar que se completaron los campos
    if (!this.request.usuario || !this.request.clave) {
      this.mensajeError = 'Debe completar todos los campos.';
      return;
    }

    // Activar spinner de carga
    this.cargando = true;

    // Llamar al servicio de autenticación
    this.authService.login(this.request).subscribe({
      next: (response) => {
        // Login exitoso: guardar token y redirigir al dashboard
        this.authService.guardarToken(response);
        this.intentosFallidos = 0;
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Login fallido: mostrar error y contar intento
        this.cargando = false;
        this.intentosFallidos++;

        if (err.status === 401) {
          // Credenciales incorrectas o cuenta inactiva
          if (this.intentosFallidos >= this.maxIntentos) {
            this.mensajeBloqueado = 'Demasiados intentos fallidos. Contacte al administrador.';
          } else {
            this.mensajeError = err.error?.mensaje ?? 'Usuario o contraseña incorrecta.';
          }
        } else {
          this.mensajeError = 'Ocurrió un error al intentar iniciar sesión.';
        }
      }
    });
  }
}