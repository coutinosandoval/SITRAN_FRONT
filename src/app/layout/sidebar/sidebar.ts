import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements OnInit {
  nombreUsuario: string = '';
  esAdmin: boolean = false;
  esCompras: boolean = false;
  esDelegado: boolean = false;
  esBodega: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.nombreUsuario = this.authService.obtenerNombre();
    this.esAdmin = this.authService.tieneRol('administrador');
    this.esCompras = this.authService.tieneRol('compras');
    this.esDelegado = this.authService.tieneRol('delegado');
    this.esBodega = this.authService.tieneRol('bodega');
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Verifica si el usuario tiene un permiso específico
  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }
}
