// ============================================================
// folio.service.ts — Llamadas al API de control de folios
// ============================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Modelos ──────────────────────────────────────────────────
export interface FolioRango {
  id: number;
  idSede: number;
  referencia: string | null;
  folioInicial: number;
  folioFinal: number;
  folioActual: number;      // próximo folio libre
  disponibles: number;
  estado: string;
  fechaCreacion: string;
  creadoPor: string | null;
}

export interface FolioPrevista {
  valido: boolean;          // true si se puede imprimir
  mensaje: string;          // motivo si no se puede
  totalFilas: number;
  hojas: number;
  folioInicial: number | null;
  folioFinal: number | null;
  disponibles: number | null;
}

export interface ImprimirLibroRequest {
  idSede: number;
  denominacion: number;
  fechaIni: string;
  fechaFin: string;
  nombreSede: string | null;
  conPlacas: boolean;
}

export interface FolioHistorial {
  lote: number;
  denominacion: number;
  periodoDesde: string;
  periodoHasta: string;
  folioInicial: number;
  folioFinal: number;
  hojas: number;
  estado: string;           // VIGENTE o ANULADA
  reimpresiones: number;
  impresoPor: string | null;
  fechaImpresion: string | null;
  motivoAnulacion: string | null;
}

@Injectable({ providedIn: 'root' })
export class FolioService {
  private apiUrl = `${environment.apiUrl}/api/folio`;

  constructor(private http: HttpClient) {}

  // Rango activo de la sede (el API responde 204 sin cuerpo si no tiene)
  obtenerRangoActivo(idSede: number): Observable<FolioRango | null> {
    const params = new HttpParams().set('idSede', idSede.toString());
    return this.http.get<FolioRango | null>(`${this.apiUrl}/rango-activo`, { params });
  }

  // Registra un rango autorizado nuevo
  registrarRango(dto: { idSede: number; referencia: string | null; folioInicial: number; folioFinal: number }) {
    return this.http.post<{ id: number; mensaje: string }>(`${this.apiUrl}/rango`, dto);
  }

  // Vista previa: hojas y folios que se usarían (no consume nada)
  prevista(idSede: number, denominacion: number, fechaIni: string, fechaFin: string): Observable<FolioPrevista> {
    const params = new HttpParams()
      .set('idSede', idSede.toString())
      .set('denominacion', denominacion.toString())
      .set('fechaIni', fechaIni)
      .set('fechaFin', fechaFin);
    return this.http.get<FolioPrevista>(`${this.apiUrl}/prevista`, { params });
  }

  // Imprime con folios; devuelve la respuesta completa para poder leer el encabezado X-Folio-Lote
  imprimir(req: ImprimirLibroRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/imprimir`, req, { observe: 'response', responseType: 'blob' });
  }

  // Reimprime un lote con los mismos folios (motivo obligatorio)
  reimprimir(lote: number, motivo: string, nombreSede: string | null, conPlacas: boolean): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/reimprimir`, { lote, motivo, nombreSede, conPlacas },
      { observe: 'response', responseType: 'blob' });
  }

  // Anula un lote completo (motivo obligatorio)
  anular(lote: number, motivo: string) {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/anular`, { lote, motivo });
  }

  // Cierra manualmente el rango activo de la sede
  cerrarRango(idSede: number) {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/cerrar-rango`, { idSede });
  }

  // Historial de impresiones de la sede
  historial(idSede: number): Observable<FolioHistorial[]> {
    const params = new HttpParams().set('idSede', idSede.toString());
    return this.http.get<FolioHistorial[]>(`${this.apiUrl}/historial`, { params });
  }

  // Cuando el API responde error y se pidió un blob, el mensaje viene dentro del Blob.
  // Esta función lo convierte en texto legible.
  async leerMensajeError(err: any, porDefecto: string): Promise<string> {
    try {
      const cuerpo = err?.error;
      if (cuerpo instanceof Blob) {
        const json = JSON.parse(await cuerpo.text());
        return json?.mensaje ?? porDefecto;
      }
      return cuerpo?.mensaje ?? porDefecto;
    } catch {
      return porDefecto;
    }
  }

  // Descarga un Blob como archivo
  descargar(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}