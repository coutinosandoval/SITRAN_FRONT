import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mantenimiento, MantenimientoLista, MantenimientoRequest, MantenimientoActualizar, CambiarEstadoMantenimiento } from '../modelos/mantenimiento.model';
import { CatalogoItem } from '../modelos/vehiculo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {

  private apiUrl = `${environment.apiUrl}/api/mantenimiento`;

  constructor(private http: HttpClient) {}

  // Obtiene lista paginada de mantenimientos
  obtener(pagina: number = 1, tamanioPagina: number = 10, busqueda?: string, idVehiculo?: number, estado?: string): Observable<MantenimientoLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (busqueda)    params = params.set('busqueda', busqueda);
    if (idVehiculo)  params = params.set('idVehiculo', idVehiculo.toString());
    if (estado)      params = params.set('estado', estado);

    return this.http.get<MantenimientoLista>(this.apiUrl, { params });
  }

  // Obtiene un mantenimiento por su ID
  obtenerPorId(id: number): Observable<Mantenimiento> {
    return this.http.get<Mantenimiento>(`${this.apiUrl}/${id}`);
  }

  // Obtiene vehículos para el formulario
  obtenerVehiculos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/vehiculos`);
  }

  // Crea un nuevo mantenimiento
  agregar(mantenimiento: MantenimientoRequest): Observable<any> {
    return this.http.post(this.apiUrl, mantenimiento);
  }

  // Actualiza un mantenimiento existente
  actualizar(id: number, mantenimiento: MantenimientoActualizar): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, mantenimiento);
  }

  // Cancela un mantenimiento
  borrar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Cambia el estado de un mantenimiento
  cambiarEstado(id: number, dto: CambiarEstadoMantenimiento): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, dto);
  }
}