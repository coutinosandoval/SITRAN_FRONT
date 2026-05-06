import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogoItem, CatalogoRequest, CatalogoActualizar, CatalogoEstado } from '../modelos/catalogo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private apiUrl = `${environment.apiUrl}/api/catalogo`;

  constructor(private http: HttpClient) {}

  obtenerTiposVehiculo(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-vehiculo`);
  }

  obtenerTiposCombustible(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-combustible`);
  }

  obtenerTiposTransmision(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-transmision`);
  }

  obtenerTiposLicencia(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-licencia`);
  }

  obtenerTiposSangre(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-sangre`);
  }

  obtenerTiposTelefono(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/tipos-telefono`);
  }

  obtenerSedes(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/sedes`);
  }

  obtenerUnidades(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/unidades`);
  }

  agregar(dto: CatalogoRequest): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  actualizar(id: number, dto: CatalogoActualizar): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  cambiarEstado(id: number, dto: CatalogoEstado): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, dto);
  }
}