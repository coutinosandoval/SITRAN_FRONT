import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  // Importamos módulos necesarios para el formulario y navegación
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  // Campo donde el usuario ingresa su correo
  correo: string = '';

  // Mensajes de estado para mostrar al usuario
  mensajeExito: string = '';
  mensajeError:  string = '';
  cargando:      boolean = false;

  constructor(
    private http: HttpClient,
    private cdr:  ChangeDetectorRef
  ) {}

  // Método que envía la solicitud de recuperación al backend
  enviarSolicitud(): void {
    if (!this.correo) {
      this.mensajeError = 'Ingrese su correo electrónico.';
      return;
    }

    this.cargando     = true;
    this.mensajeError  = '';
    this.mensajeExito  = '';

    // POST al endpoint de recuperación de contraseña
    this.http.post<any>(
      `${environment.apiUrl}/api/auth/forgot-password`,
      { correo: this.correo }
    ).subscribe({
      next: (res) => {
        // Mensaje genérico por seguridad — no revela si el correo existe
        this.mensajeExito = res.mensaje;
        this.cargando     = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al procesar la solicitud. Intente de nuevo.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }
}