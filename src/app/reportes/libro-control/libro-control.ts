import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { SedeService, Sede } from '../../servicios/sede.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-libro-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libro-control.html',
})
export class LibroControl implements OnInit {
  // ── Filtros ──────────────────────────────────────────────
  denominacion: number = 50;
  fechaIni: string = '';
  fechaFin: string = '';
  idSede: number | null = null;

  // ── Datos ────────────────────────────────────────────────
  reporte: any[] = [];

  // ── Estado ───────────────────────────────────────────────
  cargando: boolean = false;
  mensajeError: string = '';

  // ── Roles ────────────────────────────────────────────────
  esBodega: boolean = false;
  esAdmin: boolean = false;
  esJefeTransporte: boolean = false;
  esDelegado: boolean = false;
  idSedeUsuario: number | null = null;

  denominaciones = [
    { valor: 50, label: 'Q 50.00' },
    { valor: 100, label: 'Q 100.00' },
  ];

  private apiUrl = `${environment.apiUrl}/api/reporte`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.esBodega = this.authService.tienePermiso('GESTIONAR_SOLICITUDES_CUPONES');
    this.esAdmin =
      this.authService.tienePermiso('VER_REPORTES_GENERALES') ||
      this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.esJefeTransporte = this.authService.tienePermiso('GESTIONAR_COMBUSTIBLE');
    this.esDelegado = this.authService.tienePermiso('SOLICITAR_CUPONES');
    this.idSedeUsuario = this.authService.obtenerIdSede();

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaIni = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  generarReporte(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.reporte = [];

    let params = new HttpParams().set('denominacion', this.denominacion.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    // Determinar endpoint según rol
    const endpoint = this.esBodega || this.esAdmin ? 'libro-control-bodega' : 'libro-control-sede';

    this.http.get<any[]>(`${this.apiUrl}/${endpoint}`, { params }).subscribe({
      next: (data) => {
        console.log('libro control data:', data);

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

  exportarExcel(): void {
    this.cargando = true;
    const endpoint =
      this.esBodega || this.esAdmin ? 'libro-control-bodega/excel' : 'libro-control-sede/excel';

    let params = new HttpParams().set('denominacion', this.denominacion.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    this.http
      .get(`${this.apiUrl}/${endpoint}`, {
        params,
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `LibroControl_Q${this.denominacion}_${this.fechaIni}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.cargando = false;
        },
        error: () => {
          this.mensajeError = 'Error al exportar Excel.';
          this.cargando = false;
        },
      });
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-GT');
  }

  formatoQ(monto: number): string {
    return `Q${monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }
}
