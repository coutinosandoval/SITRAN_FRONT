import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoricoKilometraje, HistoricoKilometrajeLista, HistoricoKilometrajeRequest } from '../modelos/historico-km.model';
import { CatalogoItem } from '../modelos/vehiculo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoricoKmService {

  private apiUrl = `${environment.apiUrl}/api/historicokm`;

  constructor(private http: HttpClient) {}

  // Obtiene lista paginada
  obtener(pagina: number = 1, tamanioPagina: number = 10, idVehiculo?: number): Observable<HistoricoKilometrajeLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (idVehiculo)
      params = params.set('idVehiculo', idVehiculo.toString());

    return this.http.get<HistoricoKilometrajeLista>(this.apiUrl, { params });
  }

  // Obtiene un registro por ID
  obtenerPorId(id: number): Observable<HistoricoKilometraje> {
    return this.http.get<HistoricoKilometraje>(`${this.apiUrl}/${id}`);
  }

  // Obtiene vehículos para el formulario
  obtenerVehiculos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/vehiculos`);
  }

  // Crea un nuevo registro
  agregar(historico: HistoricoKilometrajeRequest): Observable<any> {
    return this.http.post(this.apiUrl, historico);
  }
}