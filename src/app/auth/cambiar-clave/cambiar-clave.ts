import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-cambiar-clave',
  standalone: true,
  // Importamos módulos necesarios para el formulario y navegación
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cambiar-clave.html',
})
export class CambiarClave {
  // Campos del formulario
  nuevaClave: string = '';
  confirmarClave: string = '';

  // Mensajes de estado
  mensajeError: string = '';
  mensajeExito: string = '';
  cargando: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

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

    this.cargando = true;
    this.mensajeError = '';

    // POST al endpoint de cambio de clave con el token JWT del usuario logueado
    this.http
      .post<any>(`${environment.apiUrl}/api/auth/cambiar-clave`, { nuevaClave: this.nuevaClave })
      .subscribe({
        next: (res) => {
          this.mensajeExito = '¡Contraseña actualizada correctamente!';
          this.cargando = false;
          this.cdr.detectChanges();
          // Redirige al dashboard después de 2 segundos
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al cambiar la contraseña.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Permite cerrar sesión si el usuario no desea cambiar la clave ahora
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
