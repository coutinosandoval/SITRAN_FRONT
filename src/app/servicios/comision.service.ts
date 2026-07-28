import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogoItem } from '../modelos/vehiculo.model';
import {
  Comision,
  ComisionLista,
  ComisionRequest,
  ComisionActualizar,
  CambiarEstadoComision,
  ComisionPersona,
  AgregarPersona,
  HistorialComision,
  EstadoComision,
  EstadisticaComision,
  ComisionDetalle,
} from '../modelos/comision.model';
import { ChecklistComision } from '../modelos/comision.model';

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
    fechaFin?: string,
    idSede?: number,
  ): Observable<ComisionLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (idEstado) params = params.set('idEstado', idEstado.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (solicitante) params = params.set('solicitante', solicitante);
    if (destino) params = params.set('destino', destino);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (idSede) params = params.set('idSede', idSede.toString());
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

  obtenerVehiculosDisponibles(
    fechaInicio: string,
    fechaFin: string,
    idSede?: number,
  ): Observable<CatalogoItem[]> {
    let params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    if (idSede !== undefined && idSede !== null) {
      params = params.set('idSede', idSede.toString());
    }
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/vehiculos-disponibles`, { params });
  }

  obtenerPilotosDisponibles(fechaInicio: string, fechaFin: string): Observable<CatalogoItem[]> {
    let params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/pilotos-disponibles`, { params });
  }

  registrarFirma(id: number, autoridad: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/firma`, { autoridad });
  }

  registrarChecklist(idComision: number, dto: ChecklistComision): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idComision}/checklist`, dto);
  }

  obtenerChecklist(idComision: number): Observable<ChecklistComision> {
    return this.http.get<ChecklistComision>(`${this.apiUrl}/${idComision}/checklist`);
  }

  // ─── CUPONES DE COMISIÓN ───

  // Asigna cupones automáticamente a una comisión
  asignarCuponesComision(idComision: number, idTalonario: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idComision}/cupones/asignar`, { idTalonario });
  }

  // Obtiene los cupones asignados a una comisión
  obtenerCuponesComision(idComision: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idComision}/cupones`);
  }

  // Finaliza una comisión registrando km final
  finalizarComision(idComision: number, dto: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${idComision}/finalizar`, dto);
  }

  reasignarPilotoVehiculo(
    idComision: number,
    idVehiculo: number,
    idPiloto: number,
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${idComision}/reasignar`, { idVehiculo, idPiloto });
  }

  // ── Comisión Local ──────────────────────────────────────────

  /** Obtiene lista de comisiones locales filtradas por sede y estado */
  obtenerComisionesLocales(
    idSede?: number,
    estado?: string,
    pagina: number = 1,
    porPagina: number = 10,
  ): Observable<any> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('porPagina', porPagina.toString());
    if (idSede) params = params.set('idSede', idSede.toString());
    if (estado) params = params.set('estado', estado);
    return this.http.get<any>(`${environment.apiUrl}/api/comision-local`, { params });
  }

  /** Obtiene una comisión local por ID */
  obtenerComisionLocalPorId(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/comision-local/${id}`);
  }

  /** Registra una nueva comisión local */
  crearComisionLocal(dto: {
    idSede?: number;
    solicitante?: string;
    idUnidad?: number;
    departamento?: string;
    fechaInicio?: string;
    horaSalida?: string;
    idVehiculo?: number; // ← agregar
    idPiloto?: number; // ← agregar
    kmInicial?: number; // ← agregar
    motivo?: string;
    observaciones?: string;
    autoridadNombre?: string;
    autoridadCargo?: string;
  }): Observable<{ id: number; mensaje: string }> {
    return this.http.post<{ id: number; mensaje: string }>(
      `${environment.apiUrl}/api/comision-local`,
      dto,
    );
  }

  /** Autoriza o rechaza una comisión local */
  autorizarComisionLocal(
    id: number,
    dto: {
      aprobar: boolean;
      motivoRechazo?: string;
    },
  ): Observable<{ mensaje: string; urlPdf?: string }> {
    return this.http.patch<{ mensaje: string; urlPdf?: string }>(
      `${environment.apiUrl}/api/comision-local/${id}/autorizar`,
      dto,
    );
  }

  // ── Actualizar asignación de comisión local ─────────────────
  actualizarAsignacionLocal(
    id: number,
    dto: {
      idVehiculo?: number;
      idPiloto?: number;
      kmInicial?: number;
    },
  ): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(
      `${environment.apiUrl}/api/comision-local/${id}/asignacion`,
      dto,
    );
  }

  // ── Cerrar comisión local ───────────────────────────────────
  cerrarComisionLocal(
    id: number,
    dto: {
      fechaFin?: string;
      horaRetorno?: string;
      kmFinal?: number;
      observacionesCierre?: string;
    },
  ): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(
      `${environment.apiUrl}/api/comision-local/${id}/cerrar`,
      dto,
    );
  }
}
