import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogoItem } from '../modelos/vehiculo.model';
import {
  Talonario,
  TalonarioLista,
  TalonarioRequest,
  TalonarioTrasladar,
  TalonarioDevolver,
  CuponLista,
  CuponAsignar,
  CuponDevolver,
  SolicitudCupon,
  SolicitudCuponLista,
  SolicitudCuponRequest,
  AprobarSolicitud,
  RechazarSolicitud,
  BitacoraTalonario,
} from '../modelos/cupon.model';
import {
  SolicitudTalonario,
  SolicitudTalonarioLista,
  SolicitudTalonarioRequest,
  AprobarSolicitudTalonario,
  RechazarSolicitudTalonario,
  SolicitudTalonarioDetalle,
  AsignarCuponesSolicitud,
  DevolverCuponesBodega,
  TalonarioBodegaDisponible,
} from '../modelos/cupon.model';
import {AprobarSolicitudTalonarioRequest } from '../modelos/cupon.model';

@Injectable({ providedIn: 'root' })
export class CuponService {
  private apiUrl = `${environment.apiUrl}/api/cupon`;

  constructor(private http: HttpClient) {}

  // ─── TALONARIOS ───

  obtenerTalonarios(
    pagina: number = 1,
    tamano: number = 10,
    estado?: number,
    idSede?: number,
  ): Observable<TalonarioLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (estado !== undefined) params = params.set('estado', estado.toString());
    if (idSede !== undefined) params = params.set('idSede', idSede.toString());
    return this.http.get<TalonarioLista>(`${this.apiUrl}/talonarios`, { params });
  }

  obtenerTalonarioPorId(id: number): Observable<Talonario> {
    return this.http.get<Talonario>(`${this.apiUrl}/talonarios/${id}`);
  }

  obtenerTalonariosDisponibles(idSede?: number): Observable<CatalogoItem[]> {
    let params = new HttpParams();
    if (idSede) params = params.set('idSede', idSede.toString());
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/talonarios/disponibles`, { params });
  }

  obtenerSedes(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/sedes`);
  }

  agregarTalonario(dto: TalonarioRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/talonarios`, dto);
  }

  trasladarTalonario(id: number, dto: TalonarioTrasladar): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${id}/trasladar`, dto);
  }

  devolverTalonario(id: number, dto: TalonarioDevolver): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${id}/devolver`, dto);
  }

  // ─── CUPONES ───

  obtenerCupones(
    pagina: number = 1,
    tamano: number = 10,
    idTalonario?: number,
    disponibilidad?: string,
  ): Observable<CuponLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (idTalonario) params = params.set('idTalonario', idTalonario.toString());
    if (disponibilidad) params = params.set('disponibilidad', disponibilidad);
    return this.http.get<CuponLista>(`${this.apiUrl}/cupones`, { params });
  }

  asignarCupones(dto: CuponAsignar): Observable<any> {
    return this.http.post(`${this.apiUrl}/cupones/asignar`, dto);
  }

  devolverCupones(dto: CuponDevolver): Observable<any> {
    return this.http.post(`${this.apiUrl}/cupones/devolver`, dto);
  }

  // ─── SOLICITUDES ───

  obtenerSolicitudes(
    pagina: number = 1,
    tamano: number = 10,
    estado?: string,
    idUnidad?: number,
  ): Observable<SolicitudCuponLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (estado) params = params.set('estado', estado);
    if (idUnidad) params = params.set('idUnidad', idUnidad.toString());
    return this.http.get<SolicitudCuponLista>(`${this.apiUrl}/solicitudes`, { params });
  }

  obtenerSolicitudPorId(id: number): Observable<SolicitudCupon> {
    return this.http.get<SolicitudCupon>(`${this.apiUrl}/solicitudes/${id}`);
  }

  agregarSolicitud(dto: SolicitudCuponRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes`, dto);
  }

  aprobarSolicitud(id: number, dto: AprobarSolicitud): Observable<any> {
    return this.http.patch(`${this.apiUrl}/solicitudes/${id}/aprobar`, dto);
  }

  rechazarSolicitud(id: number, dto: RechazarSolicitud): Observable<any> {
    return this.http.patch(`${this.apiUrl}/solicitudes/${id}/rechazar`, dto);
  }

  // ─── CATÁLOGOS ───

  obtenerVehiculos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/catalogos/vehiculos`);
  }

  obtenerPilotos(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/catalogos/pilotos`);
  }

  obtenerUnidades(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/catalogos/unidades`);
  }

  obtenerExpendedores(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/expendedores`);
  }

  obtenerBitacora(idTalonario: number): Observable<BitacoraTalonario[]> {
    return this.http.get<BitacoraTalonario[]>(`${this.apiUrl}/talonarios/${idTalonario}/bitacora`);
  }

  // ─── SOLICITUDES TALONARIO ───

  obtenerSolicitudesTalonario(
    pagina: number = 1,
    tamano: number = 10,
    estado?: string,
    idSede?: number,
  ): Observable<SolicitudTalonarioLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamano.toString());
    if (estado) params = params.set('estado', estado);
    if (idSede) params = params.set('idSede', idSede.toString());
    return this.http.get<SolicitudTalonarioLista>(`${this.apiUrl}/solicitudes-talonario`, {
      params,
    });
  }

  obtenerSolicitudTalonarioPorId(id: number): Observable<SolicitudTalonario> {
    return this.http.get<SolicitudTalonario>(`${this.apiUrl}/solicitudes-talonario/${id}`);
  }

  agregarSolicitudTalonario(dto: SolicitudTalonarioRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes-talonario`, dto);
  }

aprobarSolicitudTalonario(id: number, dto: AprobarSolicitudTalonarioRequest): Observable<any> {
  return this.http.patch(`${this.apiUrl}/solicitudes-talonario/${id}/aprobar`, dto);
}
  rechazarSolicitudTalonario(id: number, dto: RechazarSolicitudTalonario): Observable<any> {
    return this.http.patch(`${this.apiUrl}/solicitudes-talonario/${id}/rechazar`, dto);
  }

  obtenerCuponesInfo(idTalonario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/talonarios/${idTalonario}/cupones-info`);
  }

  regresarACompras(idTalonario: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${idTalonario}/regresar-compras`, {});
  }

  obtenerSedesConSolicitudPendiente(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.apiUrl}/solicitudes-talonario/sedes-pendientes`);
  }

  devolverABodega(id: number, dto: TalonarioDevolver): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${id}/devolver-bodega`, dto);
  }

  devolverACompras(id: number, dto: TalonarioDevolver): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${id}/devolver-compras`, dto);
  }

  devolverAProveedor(
    id: number,
    dto: { cuponesRetornados: number; devueltoPor?: string; observacion?: string },
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/talonarios/${id}/devolver-proveedor`, dto);
  }

  // ─── NUEVO FLUJO SOLICITUD CUPONES ───

  /**
   * Obtiene talonarios disponibles en bodega filtrados por denominación.
   * Usado por Bodega al aprobar una solicitud.
   */
  obtenerTalonariosBodegaDisponibles(valorCupon: number): Observable<TalonarioBodegaDisponible[]> {
    const params = new HttpParams().set('valorCupon', valorCupon.toString());
    return this.http.get<TalonarioBodegaDisponible[]>(
      `${this.apiUrl}/solicitudes-talonario/talonarios-bodega`,
      { params },
    );
  }

  /**
   * Asigna cupones de un talonario específico a una solicitud.
   * Puede llamarse múltiples veces para cubrir la cantidad solicitada.
   */
  asignarCuponesSolicitud(idSolicitud: number, dto: AsignarCuponesSolicitud): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/solicitudes-talonario/${idSolicitud}/asignar-cupones`,
      dto,
    );
  }
  // Devolver cupones no usados de una comisión
  devolverCuponesComision(idComision: number, idsCupones: number[]): Observable<any> {
    const baseUrl = this.apiUrl.replace('/cupon', '');
    return this.http.post(`${baseUrl}/comision/${idComision}/cupones/devolver`, { idsCupones });
  }
  /**
   * Marca la solicitud como atendida una vez asignados todos los cupones.
   */
  marcarSolicitudAtendida(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/solicitudes-talonario/${id}/marcar-atendida`, {});
  }

  /**
   * Obtiene el detalle de talonarios asignados a una solicitud.
   * Usado por Sede para ver qué talonarios tiene y cuántos cupones.
   */
  obtenerDetalleSolicitud(id: number): Observable<SolicitudTalonarioDetalle[]> {
    return this.http.get<SolicitudTalonarioDetalle[]>(
      `${this.apiUrl}/solicitudes-talonario/${id}/detalle`,
    );
  }

  /**
   * Devuelve cupones de un detalle específico a Bodega.
   * Sede indica el ID del detalle y cuántos cupones devuelve.
   */
  devolverCuponesABodega(idDetalle: number, dto: DevolverCuponesBodega): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/solicitudes-talonario/detalle/${idDetalle}/devolver`,
      dto,
    );
  }

  // Obtiene los números de cupón disponibles de un detalle de solicitud
  obtenerCuponesDisponiblesDetalle(idDetalle: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/detalle/${idDetalle}/cupones-disponibles`);
  }
}
