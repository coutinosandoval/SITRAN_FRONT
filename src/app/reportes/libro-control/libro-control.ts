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
  nombreSedeBusqueda: string = '';

  // ── Autocompletado ───────────────────────────────────────
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];
  mostrarSugerencias: boolean = false;

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
    private sedeService: SedeService,
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

    if (this.esAdmin) {
      // Admin — cargar todas las sedes para autobúsqueda
      this.sedeService.obtenerSedes().subscribe({
        next: (data) => {
          this.sedes = data;
        },
      });
    } else if (this.esBodega) {
      // Bodega — fija sede 41
      this.idSede = 41;
      this.nombreSedeBusqueda = 'Bodega Central';
    } else {
      // Jefe/Delegado — cargar nombre de su sede
      this.idSede = this.idSedeUsuario;
      if (this.idSedeUsuario) {
        this.sedeService.obtenerSedes().subscribe({
          next: (data) => {
            const sede = data.find((s) => s.id === this.idSedeUsuario);
            if (sede) this.nombreSedeBusqueda = sede.nombre;
            this.cdr.detectChanges();
          },
        });
      }
    }
  }

  // ── Autocompletado ───────────────────────────────────────
  buscarSede(): void {
    const texto = this.nombreSedeBusqueda.trim().toUpperCase();
    if (!texto) {
      this.sedesFiltradas = [];
      this.mostrarSugerencias = false;
      this.idSede = null;
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
    if (!this.idSede) {
      this.mensajeError = 'Seleccione una sede.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.reporte = [];

    let params = new HttpParams().set('denominacion', this.denominacion.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    let endpoint: string;
    if (this.idSede === 41) {
      // Bodega Central
      endpoint = 'libro-control-bodega';
    } else {
      params = params.set('idSede', this.idSede.toString());
      endpoint = 'libro-control-sede';
    }

    this.http.get<any[]>(`${this.apiUrl}/${endpoint}`, { params }).subscribe({
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

  // ── Exportar Excel ───────────────────────────────────────
  exportarExcel(): void {
    if (!this.idSede) return;

    this.cargando = true;

    let params = new HttpParams().set('denominacion', this.denominacion.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    let endpoint: string;
    if (this.idSede === 41) {
      endpoint = 'libro-control-bodega/excel';
    } else {
      params = params.set('idSede', this.idSede.toString());
      endpoint = 'libro-control-sede/excel';
    }

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
          link.download = `LibroControl_${this.nombreSedeBusqueda}_Q${this.denominacion}_${this.fechaIni}.xlsx`;
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
