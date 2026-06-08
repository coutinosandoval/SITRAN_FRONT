import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SeguridadService } from '../servicios/seguridad.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.html',
})
export class RegistroComponent {

  // ─── Formulario ───
  form = {
    nombre:   '',
    usuario:  '',
    correo:   '',
    clave:    '',
    estado:   'Activo',
    idUnidad: undefined
  };

  confirmarClave: string  = '';
  mensajeError:   string  = '';
  mensajeExito:   string  = '';
  cargando:       boolean = false;

  constructor(
    private seguridadService: SeguridadService,
    private router:           Router
  ) {}

  registrar(): void {
    // Validaciones
    if (!this.form.nombre.trim()) {
      this.mensajeError = 'El nombre es requerido.';
      return;
    }
    if (!this.form.usuario.trim()) {
      this.mensajeError = 'El usuario es requerido.';
      return;
    }
    if (!this.form.correo.trim()) {
      this.mensajeError = 'El correo es requerido.';
      return;
    }
    if (!this.form.clave.trim() || this.form.clave.length < 6) {
      this.mensajeError = 'La contraseña debe tener mínimo 6 caracteres.';
      return;
    }
    if (this.form.clave !== this.confirmarClave) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    this.mensajeError = '';
    this.cargando     = true;

    this.seguridadService.registro(this.form).subscribe({
      next: () => {
        this.cargando     = false;
        this.mensajeExito = 'Cuenta creada correctamente. Espere que el administrador le asigne un rol.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: () => {
        this.mensajeError = 'Error al crear la cuenta. El usuario o correo ya existe.';
        this.cargando     = false;
      }
    });
  }
}
