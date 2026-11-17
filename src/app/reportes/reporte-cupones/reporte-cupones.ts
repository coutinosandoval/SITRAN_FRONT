import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { SedeService, Sede } from '../../servicios/sede.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reporte-cupones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-cupones.html',
})
export class ReporteCuponesComponent implements OnInit {
  // ── Filtros ──────────────────────────────────────────────
  idSede: number = 0;
  nombreSedeBusqueda: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  // ── Autocompletado de sede ───────────────────────────────
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];
  mostrarSugerencias: boolean = false;

  // ── Datos del reporte ────────────────────────────────────
  reporte: any[] = [];
  cargando: boolean = false;

  // ── Mensajes ─────────────────────────────────────────────
  mensajeError: string = '';
  mensajeExito: string = '';

  private apiUrl = `${environment.apiUrl}/api/reporte`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private sedeService: SedeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Determinar si puede ver todas las sedes
    const esAdmin =
      this.authService.tienePermiso('VER_REPORTES_GENERALES') ||
      this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');

    if (esAdmin) {
      // Cargar todas las sedes para el selector
      this.sedeService.obtenerSedes().subscribe({
        next: (data) => {
          this.sedes = data;
        },
      });
    } else {
      // Fijar automáticamente la sede del usuario
      const idSede = this.authService.obtenerIdSede();
      if (idSede) {
        this.idSede = idSede;
        // Buscar nombre de la sede
        this.sedeService.obtenerSedes().subscribe({
          next: (data) => {
            const sede = data.find((s) => s.id === idSede);
            if (sede) this.nombreSedeBusqueda = sede.nombre;
          },
        });
      }
    }

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  // ── Autocompletado ───────────────────────────────────────
  buscarSede(): void {
    const texto = this.nombreSedeBusqueda.trim().toUpperCase();
    if (!texto) {
      this.sedesFiltradas = [];
      this.mostrarSugerencias = false;
      this.idSede = 0;
      return;
    }
    this.sedesFiltradas = this.sedes.filter((s) => s.nombre.toUpperCase().includes(texto));
    this.mostrarSugerencias = this.sedesFiltradas.length > 0;
  }

  seleccionarSede(sede: Sede): void {
    this.idSede = sede.id;
    this.nombreSedeBusqueda = sede.nombre;
    this.mostrarSugerencias = false;
  }

  ocultarSugerencias(): void {
    setTimeout(() => (this.mostrarSugerencias = false), 200);
  }

  // ── Generar reporte ──────────────────────────────────────
  generarReporte(): void {
    if (!this.formularioValido) return;

    this.cargando = true;
    this.mensajeError = '';
    this.reporte = [];

    let params = new HttpParams().set('idSede', this.idSede.toString());
    if (this.fechaInicio) params = params.set('fechaIni', this.fechaInicio);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    this.http.get<any[]>(`${this.apiUrl}/cupones-sede`, { params }).subscribe({
      next: (data) => {
        this.reporte = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al generar el reporte.';
        this.cargando = false;
      },
    });
  }

  // ── Totales ──────────────────────────────────────────────
  get totalQ50(): number {
    return this.reporte.filter((r) => r.denominacion === 50).reduce((a, r) => a + r.cantidad, 0);
  }

  get totalQ100(): number {
    return this.reporte.filter((r) => r.denominacion === 100).reduce((a, r) => a + r.cantidad, 0);
  }

  get montoTotalQ50(): number {
    return this.reporte.filter((r) => r.denominacion === 50).reduce((a, r) => a + r.monto, 0);
  }

  get montoTotalQ100(): number {
    return this.reporte.filter((r) => r.denominacion === 100).reduce((a, r) => a + r.monto, 0);
  }

  get montoTotal(): number {
    return this.montoTotalQ50 + this.montoTotalQ100;
  }

  // ── Números individuales ─────────────────────────────────
  numerosEntregados(r: any): string {
    const nums: number[] = [];
    for (let i = r.numeroDel; i <= r.numeroAl; i++) nums.push(i);
    return nums.join(', ');
  }

  // ── Exportar Excel ───────────────────────────────────────
  exportarExcel(): void {
    if (!this.formularioValido) return;

    let params = new HttpParams().set('idSede', this.idSede.toString());
    if (this.fechaInicio) params = params.set('fechaIni', this.fechaInicio);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    this.http
      .get(`${this.apiUrl}/cupones-sede/excel`, {
        params,
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Cupones_${this.nombreSedeBusqueda}_${this.fechaInicio}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.mensajeError = 'Error al exportar Excel.';
        },
      });
  }

  // ── Exportar PDF ─────────────────────────────────────────
  exportarPdf(): void {
    if (!this.formularioValido) return;

    let params = new HttpParams()
      .set('idSede', this.idSede.toString())
      .set('sedeNombre', this.nombreSedeBusqueda);
    if (this.fechaInicio) params = params.set('fechaIni', this.fechaInicio);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    this.http
      .get(`${this.apiUrl}/cupones-sede/pdf`, {
        params,
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Cupones_${this.nombreSedeBusqueda}_${this.fechaInicio}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.mensajeError = 'Error al exportar PDF.';
        },
      });
  }

  // ── Validación ───────────────────────────────────────────
  get formularioValido(): boolean {
    return (
      !!this.idSede &&
      !!this.fechaInicio &&
      !!this.fechaFin &&
      new Date(this.fechaInicio) <= new Date(this.fechaFin)
    );
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-GT');
  }

  formatoQ(monto: number): string {
    return `Q${monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
