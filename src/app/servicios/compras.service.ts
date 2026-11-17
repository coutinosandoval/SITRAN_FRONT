// ============================================================
// compras.service.ts — Llamadas HTTP al backend de compras
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Compra, CompraDetalle, ComprasPaginadas } from '../modelos/compra.model';

@Injectable({ providedIn: 'root' })
export class ComprasService {

  private readonly url = `${environment.apiUrl}/api/compras`;

  constructor(private http: HttpClient) {}

  /** Registra una nueva compra con sus rangos */
  agregarCompra(dto: {
    fechaCompra:      string;
    idExpendedor:     number;
    fechaEmision:     string;
    fechaVencimiento: string;
    observaciones?:   string;
    detalles:         { denominacion: number; numeroDel: number; numeroAl: number }[];
  }): Observable<{ idCompra: number; mensaje: string }> {
    return this.http.post<{ idCompra: number; mensaje: string }>(this.url, dto);
  }

  /** Lista paginada de compras */
  obtenerCompras(pagina = 1, porPagina = 10): Observable<ComprasPaginadas> {
    const params = new HttpParams()
      .set('pagina',    pagina)
      .set('porPagina', porPagina);
    return this.http.get<ComprasPaginadas>(this.url, { params });
  }

  /** Detalle de rangos de una compra */
  obtenerDetalle(idCompra: number): Observable<CompraDetalle[]> {
    return this.http.get<CompraDetalle[]>(`${this.url}/${idCompra}/detalle`);
  }
}