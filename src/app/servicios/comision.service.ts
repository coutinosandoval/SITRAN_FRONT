import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogoItem } from '../modelos/vehiculo.model';
import {
  Comision, ComisionLista, ComisionRequest, ComisionActualizar,
  CambiarEstadoComision, ComisionPersona, AgregarPersona,
  HistorialComision, EstadoComision, EstadisticaComision, ComisionDetalle
} from '../modelos/comision.model';

@Injectable({ providedIn: 'root' })
export class ComisionService {

  private apiUrl = `${environment.apiUrl}/api/comision`;

  constructor(private http: HttpClient) {}

  obtenerComisiones(
    pagina: number = 1,
    tamano: number = 10,
    idEstado?: number,
    tipo?: string,
    solicitante?: string,
    destino?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<ComisionLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (idEstado)   params = params.set('idEstado',   idEstado.toString());
    if (tipo)       params = params.set('tipo',       tipo);
    if (solicitante) params = params.set('solicitante', solicitante);
    if (destino)    params = params.set('destino',    destino);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin)   params = params.set('fechaFin',   fechaFin);
    return this.http.get<ComisionLista>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<ComisionDetalle> {
    return this.http.get<ComisionDetalle>(`${this.apiUrl}/${id}`);
  }

  agregar(dto: ComisionRequest): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  actualizar(id: number, dto: ComisionActualizar): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  cambiarEstado(id: number, dto: CambiarEstadoComision): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, dto);
  }

  agregarPersona(idComision: number, dto: AgregarPersona): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idComision}/personas`, dto);
  }

  eliminarPersona(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/personas/${id}`);
  }

  obtenerEstadisticas(): Observable<EstadisticaComision[]> {
    return this.http.get<EstadisticaComision[]>(`${this.apiUrl}/estadisticas`);
  }

  obtenerEstados(): Observable<EstadoComision[]> {
    return this.http.get<EstadoComision[]>(`${this.apiUrl}/estados`);
  }

  obtenerUnidades(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/unidades`);
  }

  obtenerVehiculosDisponibles(fechaInicio: string, fechaFin: string): Observable<CatalogoItem[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/vehiculos-disponibles`, { params });
  }

  obtenerPilotosDisponibles(fechaInicio: string, fechaFin: string): Observable<CatalogoItem[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/pilotos-disponibles`, { params });
  }

  registrarFirma(id: number, autoridad: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/firma`, { autoridad });
}
}