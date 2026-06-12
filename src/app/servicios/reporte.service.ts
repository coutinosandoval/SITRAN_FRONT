import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BitacoraVehiculo, FiltroBitacoraVehiculos } from '../modelos/bitacora-vehiculo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  // URL base del API de reportes
  private apiUrl = `${environment.apiUrl}/api/reporte`;

  constructor(private http: HttpClient) {}

  // Construye los parámetros de consulta a partir del filtro
  private construirParametros(filtro: FiltroBitacoraVehiculos): HttpParams {
    let params = new HttpParams();

    if (filtro.idVehiculo) params = params.set('idVehiculo', filtro.idVehiculo.toString());
    if (filtro.idSede)     params = params.set('idSede', filtro.idSede.toString());
    if (filtro.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro.fechaFin)    params = params.set('fechaFin', filtro.fechaFin);

    return params;
  }

  // Obtiene los datos del reporte para mostrar en pantalla
  obtenerBitacoraVehiculos(filtro: FiltroBitacoraVehiculos): Observable<BitacoraVehiculo[]> {
    const params = this.construirParametros(filtro);
    return this.http.get<BitacoraVehiculo[]>(`${this.apiUrl}/bitacora-vehiculos`, { params });
  }

  // Descarga el reporte en formato Excel
  exportarExcel(filtro: FiltroBitacoraVehiculos): Observable<Blob> {
    const params = this.construirParametros(filtro);
    return this.http.get(`${this.apiUrl}/bitacora-vehiculos/excel`, { params, responseType: 'blob' });
  }

  // Descarga el reporte en formato PDF
  exportarPdf(filtro: FiltroBitacoraVehiculos): Observable<Blob> {
    const params = this.construirParametros(filtro);
    return this.http.get(`${this.apiUrl}/bitacora-vehiculos/pdf`, { params, responseType: 'blob' });
  }

  // Descarga el reporte en formato Word
  exportarWord(filtro: FiltroBitacoraVehiculos): Observable<Blob> {
    const params = this.construirParametros(filtro);
    return this.http.get(`${this.apiUrl}/bitacora-vehiculos/word`, { params, responseType: 'blob' });
  }
}
