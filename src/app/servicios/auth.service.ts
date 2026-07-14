import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../modelos/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private base = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {
    // Verificar token al iniciar la aplicación
    this.verificarSesion();
  }

  // Verifica si la sesión sigue válida al cargar la app
  private verificarSesion(): void {
    const expiracion = sessionStorage.getItem('expiracion');
    if (expiracion && new Date(expiracion) < new Date()) {
      sessionStorage.clear();
    }
  }

  // Realiza el login contra el API
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, request);
  }

  // Guarda el token y datos del usuario en sessionStorage
  // sessionStorage se borra automáticamente al cerrar el navegador
  guardarToken(response: LoginResponse): void {
    sessionStorage.setItem('token', response.token);
    sessionStorage.setItem('nombre', response.nombre);
    sessionStorage.setItem('usuarioSistema', response.usuarioSistema);
    sessionStorage.setItem('roles', JSON.stringify(response.roles));
    sessionStorage.setItem('expiracion', response.expiracion);
    sessionStorage.setItem('idUnidad', response.idUnidad?.toString() || '');
    sessionStorage.setItem('idSede', response.idSede?.toString() || '');
    sessionStorage.setItem('tipoLugar', response.tipoLugar || '');
    sessionStorage.setItem('permisos', JSON.stringify(response.permisos || []));
  }

  // Elimina el token y datos del usuario
  eliminarToken(): void {
    sessionStorage.clear();
  }

  // Cierra la sesión del usuario
  logout(): void {
    sessionStorage.clear();
  }

  // Verifica si el usuario está autenticado
  estaAutenticado(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    const expiracion = sessionStorage.getItem('expiracion');
    if (expiracion && new Date(expiracion) < new Date()) {
      this.eliminarToken();
      return false;
    }

    return true;
  }

  // Obtiene el nombre del usuario autenticado
  obtenerNombre(): string {
    return sessionStorage.getItem('nombre') || '';
  }

  // Obtiene el token JWT
  obtenerToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // Obtiene el usuario del sistema
  obtenerUsuario(): string {
    return sessionStorage.getItem('usuarioSistema') || '';
  }

  // Obtiene los roles del usuario autenticado
  obtenerRoles(): string[] {
    const roles = sessionStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  // Verifica si el usuario tiene un rol específico
  tieneRol(rol: string): boolean {
    return this.obtenerRoles().some((r) => r.toLowerCase() === rol.toLowerCase());
  }

  obtenerIdUnidad(): number | null {
    const val = sessionStorage.getItem('idUnidad');
    return val ? parseInt(val) : null;
  }

  obtenerTipoLugar(): string {
    return sessionStorage.getItem('tipoLugar') || '';
  }

  // Obtiene los permisos del usuario autenticado
  obtenerPermisos(): string[] {
    const permisos = sessionStorage.getItem('permisos');
    return permisos ? JSON.parse(permisos) : [];
  }

  // Verifica si el usuario tiene un permiso específico
  tienePermiso(permiso: string): boolean {
    return this.obtenerPermisos().some((p) => p.toUpperCase() === permiso.toUpperCase());
  }

  obtenerIdSede(): number | null {
    const val = sessionStorage.getItem('idSede');
    return val ? parseInt(val) : null;
  }
}
