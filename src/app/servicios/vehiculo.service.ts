import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Vehiculo,
  VehiculoLista,
  VehiculoRequest,
  VehiculoCatalogos,
} from '../modelos/vehiculo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VehiculoService {
  // URL base del API
  private apiUrl = `${environment.apiUrl}/api/vehiculo`;

  constructor(private http: HttpClient) {}

  // Obtiene lista paginada de vehículos
  obtener(
    pagina: number = 1,
    tamanioPagina: number = 10,
    busqueda?: string,
  ): Observable<VehiculoLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (busqueda) params = params.set('busqueda', busqueda);

    return this.http.get<VehiculoLista>(this.apiUrl, { params });
  }

  // Obtiene un vehículo por su ID
  obtenerPorId(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }

  // Obtiene catálogos para el formulario
  obtenerCatalogos(): Observable<VehiculoCatalogos> {
    return this.http.get<VehiculoCatalogos>(`${this.apiUrl}/catalogos`);
  }

  // Crea un nuevo vehículo
  agregar(vehiculo: VehiculoRequest): Observable<any> {
    return this.http.post(this.apiUrl, vehiculo);
  }

  // Actualiza un vehículo existente
  actualizar(id: number, vehiculo: VehiculoRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, vehiculo);
  }

  // Elimina lógicamente un vehículo
  borrar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Cambia la disponibilidad de un vehículo
  cambiarDisponibilidad(id: number, estado: string, observaciones: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/disponibilidad`, { estado, observaciones });
  }

  // Traslada un vehículo a otra sede
  trasladar(id: number, idSedeDestino: number, observaciones: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/trasladar`, { idSedeDestino, observaciones });
  }
}
