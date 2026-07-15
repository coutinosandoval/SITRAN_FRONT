import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Usuario,
  UsuarioLista,
  UsuarioCrear,
  UsuarioActualizar,
  Rol,
  RolCrear,
  Permiso,
} from '../modelos/seguridad.model';

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  // URL base del API de seguridad
  private apiUrl = `${environment.apiUrl}/api/seguridad`;

  constructor(private http: HttpClient) {}

  // ─── USUARIOS ───

  // Obtener lista paginada de usuarios
  obtenerUsuarios(
    pagina: number,
    tamano: number,
    estado?: string,
    busqueda?: string,
  ): Observable<UsuarioLista> {
    console.log('Service: obtenerUsuarios llamado');
    let params: any = { pagina, tamano };
    if (estado) params['estado'] = estado;
    if (busqueda) params['busqueda'] = busqueda;
    return this.http.get<UsuarioLista>(`${this.apiUrl}/usuarios`, { params });
  }

  // Obtener usuario por ID
  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  // Crear usuario
  crearUsuario(dto: UsuarioCrear): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, dto);
  }

  // Actualizar usuario
  actualizarUsuario(id: number, dto: UsuarioActualizar): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, dto);
  }

  // Obtener roles de un usuario
  obtenerRolesUsuario(id: number): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/usuarios/${id}/roles`);
  }

  // Asignar rol a usuario
  asignarRol(id: number, idRol: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${id}/roles`, { idRol });
  }

  // Quitar rol de usuario
  quitarRol(id: number, idRol: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}/roles/${idRol}`);
  }

  // ─── ROLES ───

  // Obtener lista de roles
  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  // Crear rol
  crearRol(dto: RolCrear): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles`, dto);
  }

  // Obtener permisos de un rol
  obtenerPermisosRol(id: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/roles/${id}/permisos`);
  }

  // Asignar permiso a rol
  asignarPermiso(id: number, idPermiso: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles/${id}/permisos`, { idPermiso });
  }

  // Quitar permiso de rol
  quitarPermiso(id: number, idPermiso: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${id}/permisos/${idPermiso}`);
  }

  // ─── PERMISOS ───

  // Obtener lista de permisos
  obtenerPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/permisos`);
  }

  // Registro público de usuario
  registro(dto: UsuarioCrear): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, dto);
  }

  inactivarRol(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/inactivar-rol`, {});
  }
}
