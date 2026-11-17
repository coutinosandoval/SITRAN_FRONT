import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { environment } from '../../../environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { VehiculoService } from '../../servicios/vehiculo.service';
import { SedeService } from '../../servicios/sede.service';

@Component({
  selector: 'app-reporte-cupones-vehiculo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-cupones-vehiculo.html',
})
export class ReporteCuponesVehiculo implements OnInit {
  // ── Filtros ──────────────────────────────────────────────
  idVehiculo: number | null = null;
  idSede: number | null = null;
  fechaIni: string = '';
  fechaFin: string = '';

  // ── Datos ────────────────────────────────────────────────
  vehiculos: any[] = [];
  sedes: any[] = [];
  reporte: any[] = [];

  // ── Estado ───────────────────────────────────────────────
  cargando: boolean = false;
  mensajeError: string = '';

  // ── Roles ────────────────────────────────────────────────
  esAdmin: boolean = false;
  idSedeUsuario: number | null = null;

  vehiculosFiltrados: any[] = [];

  private apiUrl = `${environment.apiUrl}/api/reporte`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private vehiculoService: VehiculoService,
    private sedeService: SedeService,
  ) {}

  ngOnInit(): void {
    this.esAdmin =
      this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS') ||
      this.authService.tienePermiso('VER_REPORTES_GENERALES');
    this.idSedeUsuario = this.authService.obtenerIdSede();

    // Solo fija la sede si NO tiene acceso general
    if (!this.esAdmin) this.idSede = this.idSedeUsuario;

    this.cargarVehiculos();
    if (this.esAdmin) this.cargarSedes();
  }

  cargarVehiculos(): void {
    this.vehiculoService.obtener(1, 100).subscribe({
      next: (data) => {
        const todos = data.vehiculos || [];
        // Si no es admin, filtrar solo los vehículos de su sede
        this.vehiculos = this.esAdmin
          ? todos
          : todos.filter((v: any) => v.idSede === this.idSedeUsuario);
        this.cdr.detectChanges();
      },
    });
    this.vehiculosFiltrados = this.vehiculos;

  }

onSedeCambiada(): void {
  if (!this.idSede) {
    this.vehiculosFiltrados = this.vehiculos;
  } else {
    this.vehiculosFiltrados = this.vehiculos.filter(
      (v: any) => v.idSede === this.idSede
    );
  }
  this.idVehiculo = null;
  this.cdr.detectChanges();
}

  cargarSedes(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes = data;
        this.cdr.detectChanges();
      },
    });
  }

  generarReporte(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.reporte = [];

    let params = new HttpParams();
    if (this.idVehiculo) params = params.set('idVehiculo', this.idVehiculo.toString());
    if (this.idSede) params = params.set('idSede', this.idSede.toString());
    if (this.fechaIni) params = params.set('fechaIni', this.fechaIni);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);

    this.http.get<any[]>(`${this.apiUrl}/cupones-vehiculo`, { params }).subscribe({
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
    return this.reporte
      .filter((r) => r.denominacion === 50)
      .reduce((acc, r) => acc + r.cantidad, 0);
  }

  get totalMontoQ50(): number {
    return this.reporte.filter((r) => r.denominacion === 50).reduce((acc, r) => acc + r.monto, 0);
  }

  get totalQ100(): number {
    return this.reporte
      .filter((r) => r.denominacion === 100)
      .reduce((acc, r) => acc + r.cantidad, 0);
  }

  get totalMontoQ100(): number {
    return this.reporte.filter((r) => r.denominacion === 100).reduce((acc, r) => acc + r.monto, 0);
  }

  get totalKmRecorridos(): number {
    // Sumar km recorridos únicos por solicitud (evitar duplicados por denominación)
    const ids = new Set<number>();
    return this.reporte.reduce((acc, r) => {
      if (!ids.has(r.idSolicitud) && r.kmRecorridos) {
        ids.add(r.idSolicitud);
        return acc + r.kmRecorridos;
      }
      return acc;
    }, 0);
  }

  get montoTotal(): number {
    return this.totalMontoQ50 + this.totalMontoQ100;
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-GT');
  }

  formatoQ(monto: number): string {
    return `Q${monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }
}
