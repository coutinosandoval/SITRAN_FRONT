import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { SedeService, Sede } from '../../servicios/sede.service';
import { environment } from '../../../environments/environment';
import { ImprimirFolios } from '../imprimir-folios/imprimir-folios';

@Component({
  selector: 'app-libro-control-sedes',
  standalone: true,
  imports: [CommonModule, FormsModule, ImprimirFolios],
  templateUrl: './libro-control-sedes.html',
})
export class LibroControlSedes implements OnInit {
  // ── Filtros ──────────────────────────────────────────────
  denominacion: number = 50;
  fechaIni: string = '';
  fechaFin: string = '';
  idSede: number | null = null;
  nombreSedeBusqueda: string = '';

  // ── Autocompletado (solo roles que pueden elegir sede) ───
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];
  mostrarSugerencias: boolean = false;

  // ── Datos y estado ───────────────────────────────────────
  reporte: any[] = [];
  cargando: boolean = false;
  mensajeError: string = '';

  // ── Roles ────────────────────────────────────────────────
  // esAdmin: puede elegir cualquier sede.
  // Los demás (delegado, jefe de transporte, etc.) ven solo la suya.
  esAdmin: boolean = false;
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
    this.esAdmin =
      this.authService.tienePermiso('VER_REPORTES_GENERALES') ||
      this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.idSedeUsuario = this.authService.obtenerIdSede();

    // Rango por defecto: del primer día del mes a hoy
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaIni = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];

    this.sedeService.obtenerSedes().subscribe({
      next: (data) => {
        if (this.esAdmin) {
          // Admin elige sede; se excluye Almacén / Bodega Central (id 41), que tiene su propio libro
          this.sedes = data.filter((s) => {
            const nombre = s.nombre.toUpperCase();
            const esCompras = nombre.includes('COMPRAS') && nombre.includes('SEDE CENTRAL');
            return s.id !== 41 && !esCompras;
          });
        } else {
          // Resto de roles: sede fija, la del usuario
          this.idSede = this.idSedeUsuario;
          const sede = data.find((s) => s.id === this.idSedeUsuario);
          if (sede) this.nombreSedeBusqueda = sede.nombre;
        }
        this.cdr.detectChanges();
      },
    });
  }

  // ── Autocompletado de sede ───────────────────────────────
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

  // Parámetros comunes a la consulta y al Excel
  private construirParams(): HttpParams {
    let params = new HttpParams()
      .set('idSede', this.idSede!.toString())
      .set('denominacion', this.denominacion.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);
    return params;
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

    this.http
      .get<any[]>(`${this.apiUrl}/libro-control-sede`, { params: this.construirParams() })
      .subscribe({
        next: (data) => {
          this.reporte = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al generar el reporte.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Exportar Excel (con columna de placas) ───────────────
  exportarExcel(): void {
    if (!this.idSede) return;
    this.cargando = true;

    // conPlacas=true → el backend agrega la columna PLACAS VEHÍCULO
    const params = this.construirParams()
      .set('nombreSede', this.nombreSedeBusqueda)
      .set('conPlacas', 'true');

    this.http
      .get(`${this.apiUrl}/libro-control-sede/excel`, { params, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `LibroControlSedes_${this.nombreSedeBusqueda}_Q${this.denominacion}_${this.fechaIni}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al exportar Excel.';
          this.cargando = false;
          this.cdr.detectChanges();
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
