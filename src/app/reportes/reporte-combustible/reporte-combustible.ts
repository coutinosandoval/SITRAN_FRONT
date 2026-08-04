// ============================================================
// reporte-combustible.ts
// Reporte de consumo de combustible por vehículo
// Incluye: consolidado por sede/vehículo y detalle por solicitud
// Ruta: src/app/reportes/reporte-combustible/reporte-combustible.ts
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reporte-combustible',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-combustible.html',
})
export class ReporteCombustibleComponent implements OnInit {
  // ─── Datos del reporte ────────────────────────────────────
  datosConsolidado: any[] = [];
  datosDetalle: any[] = [];

  // ─── Filtros ──────────────────────────────────────────────
  idSedeUsuario: number | null = null;
  fechaIni: string = '';
  fechaFin: string = '';
  tipoReporte: string = 'consolidado'; // 'consolidado' | 'detalle'
  datosDetalleVehiculo: any[] = [];
  datosLibro: any[] = [];
  datosMovimientos: any[] = [];
  // ─── Estado ───────────────────────────────────────────────
  cargando: boolean = false;
  mensajeError: string = '';

  // ─── Totales consolidado ──────────────────────────────────
  get totalSolicitudes(): number {
    return this.datosConsolidado.reduce((a, r) => a + (Number(r['TOTAL_SOLICITUDES']) || 0), 0);
  }

  get totalCupones(): number {
    return this.datosConsolidado.reduce((a, r) => a + (Number(r['TOTAL_UTILIZADOS']) || 0), 0);
  }

  get totalMonto(): number {
    return this.datosConsolidado.reduce((a, r) => a + (Number(r['MONTO_TOTAL']) || 0), 0);
  }
  /** Agrupa datos de detalle vehículo por placa */
  get datosAgrupadosPorVehiculo(): any[] {
    const grupos: any[] = [];
    const mapa = new Map<string, any>();

    for (const r of this.datosDetalleVehiculo) {
      const placa = r['VEHICULO_PLACA'];
      if (!mapa.has(placa)) {
        mapa.set(placa, {
          placa: placa,
          nombre: r['VEHICULO_NOMBRE'],
          sede: r['SEDE_NOMBRE'],
          comisiones: [],
          totalKm: 0,
          totalCupones: 0,
          totalMonto: 0,
        });
      }
      const grupo = mapa.get(placa);
      grupo.comisiones.push(r);
      grupo.totalKm += Number(r['KM_RECORRIDOS']) || 0;
      grupo.totalCupones += Number(r['CUPONES_UTILIZADOS']) || 0;
      grupo.totalMonto += Number(r['MONTO_COMBUSTIBLE']) || 0;
    }

    mapa.forEach((v) => grupos.push(v));
    return grupos;
  }

  private apiUrl = `${environment.apiUrl}/api/reporte`;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Obtener sede del usuario logueado
    this.idSedeUsuario = this.authService.obtenerIdUnidad();

    // Fechas por defecto: mes actual
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaIni = primerDiaMes.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];

    // Cargar reporte inicial
    this.generarReporte();
  }

  // ─── Generar reporte ──────────────────────────────────────

  /** Genera el reporte según el tipo seleccionado */
  generarReporte(): void {
    if (this.tipoReporte === 'consolidado') {
      this.cargarConsolidado();
    } else if (this.tipoReporte === 'detalle') {
      this.cargarDetalle();
    } else if (this.tipoReporte === 'vehiculo') {
      this.cargarDetalleVehiculo();
    } else if (this.tipoReporte === 'libro') {
      this.cargarLibroControl();
    } else if (this.tipoReporte === 'movimientos') {
      this.cargarMovimientosVehiculo();
    }
  }

  /** Carga reporte de movimientos por vehículo */
  cargarMovimientosVehiculo(): void {
    this.cargando = true;
    this.mensajeError = '';

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/movimientos-vehiculo`, { params }).subscribe({
      next: (data) => {
        this.datosMovimientos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar movimientos de vehículos.';
        this.cargando = false;
      },
    });
  }
  /** Carga el Libro de Control de Cupones */
  cargarLibroControl(): void {
    this.cargando = true;
    this.mensajeError = '';

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/libro-control-cupones`, { params }).subscribe({
      next: (data) => {
        this.datosLibro = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el libro de control.';
        this.cargando = false;
      },
    });
  }

  /** Carga el reporte consolidado por vehículo */
  cargarConsolidado(): void {
    this.cargando = true;
    this.mensajeError = '';

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/combustible/consolidado`, { params }).subscribe({
      next: (data) => {
        this.datosConsolidado = [...data]; // ← spread operator
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el reporte consolidado.';
        this.cargando = false;
      },
    });
  }

  /** Carga el reporte detallado por solicitud */
  cargarDetalle(): void {
    this.cargando = true;
    this.mensajeError = '';

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/combustible/detalle`, { params }).subscribe({
      next: (data) => {
        this.datosDetalle = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el reporte detallado.';
        this.cargando = false;
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────

  /** Formatea número como quetzales */
  formatoQ(valor: any): string {
    const num = Number(valor) || 0;
    return `Q${num.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  /** Descarga el reporte en Excel */
  descargarExcel(): void {
    let endpoint = '';

    if (this.tipoReporte === 'consolidado') {
      endpoint = 'combustible/consolidado/excel';
    } else if (this.tipoReporte === 'detalle') {
      endpoint = 'combustible/detalle/excel';
    } else if (this.tipoReporte === 'vehiculo') {
      endpoint = 'vehiculo/detalle/excel';
    } else if (this.tipoReporte === 'libro') {
      endpoint = 'libro-control-cupones/excel';
    } else if (this.tipoReporte === 'movimientos') {
      endpoint = 'movimientos-vehiculo/excel';
    }

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get(`${this.apiUrl}/${endpoint}`, { params, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.tipoReporte}_${this.fechaIni}_${this.fechaFin}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.mensajeError = 'Error al descargar el Excel.';
      },
    });
  }

  /** Genera lista de números de cupones desde un inicio y cantidad */
  generarListaCupones(desde: number, cantidad: number): string {
    const cupones = [];
    for (let i = 0; i < cantidad; i++) {
      cupones.push(desde + i);
    }
    return cupones.join(', ');
  }

  /** Carga el reporte detallado por vehículo con comisiones */
  cargarDetalleVehiculo(): void {
    this.cargando = true;
    this.mensajeError = '';

    let params = new HttpParams().set('fechaIni', this.fechaIni).set('fechaFin', this.fechaFin);

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/vehiculo/detalle`, { params }).subscribe({
      next: (data) => {
        this.datosDetalleVehiculo = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el reporte de vehículos.';
        this.cargando = false;
      },
    });
  }

  /** Color del badge según tipo de movimiento */
  colorTipo(tipo: string): string {
    switch (tipo) {
      case 'Comisión':
        return 'bg-primary';
      case 'Mantenimiento':
        return 'bg-warning text-dark';
      case 'Traslado':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  }
}
