// ============================================================
// porteria.ts
// Componente para control de portería — salida y entrada de vehículos
// Ruta: src/app/porteria/porteria.ts
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../servicios/auth.service';
import { ComisionService } from '../servicios/comision.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-porteria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './porteria.html',
})
export class PorteriaComponent implements OnInit {
  // ─── Listas ───
  vehiculosEnRuta: any[] = [];
  historial: any[] = [];
  vehiculos: any[] = [];
  pilotos: any[] = [];
  comisiones: any[] = [];

  // ─── Paginación historial ───
  paginaActual: number = 1;
  tamanioPagina: number = 20;
  totalRegistros: number = 0;
  totalPaginas: number = 0;

  // ─── Vista activa ───
  vistaActiva: string = 'enRuta'; // 'enRuta' | 'historial' | 'salida'

  // ─── Formulario salida ───
  salidaIdVehiculo: number = 0;
  salidaIdPiloto: number = 0;
  salidaIdComision: number | null = null;
  salidaTipo: string = 'Comisión';
  salidaMotivo: string = '';

  // ─── Modal entrada ───
  mostrarModalEntrada: boolean = false;
  movimientoSeleccionado: any = null;
  kmEntrada: number = 0;

  // ─── Filtros historial ───
  filtroFechaIni: string = '';
  filtroFechaFin: string = '';

  // ─── Roles ───
  idSedeUsuario: number | null = null;

  // ─── Estado ───
  cargando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  private apiUrl = `${environment.apiUrl}/api/porteria`;

  constructor(
    private authService: AuthService,
    private comisionService: ComisionService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.idSedeUsuario = this.authService.obtenerIdUnidad();

    // Fechas por defecto para historial
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtroFechaIni = primerDiaMes.toISOString().split('T')[0];
    this.filtroFechaFin = hoy.toISOString().split('T')[0];

    this.cargarEnRuta();
    this.cargarVehiculos();
    this.cargarPilotos();
    this.cargarComisionesActivas();
  }

  // ─── Carga de datos ──────────────────────────────────────

  /** Carga vehículos actualmente en ruta */
  cargarEnRuta(): void {
    this.cargando = true;
    let params = new HttpParams();
    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());

    this.http.get<any[]>(`${this.apiUrl}/en-ruta`, { params }).subscribe({
      next: (data) => {
        this.vehiculosEnRuta = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar vehículos en ruta.';
        this.cargando = false;
      },
    });
  }

  /** Carga historial de movimientos */
  cargarHistorial(): void {
    this.cargando = true;
    let params = new HttpParams()
      .set('pagina', this.paginaActual.toString())
      .set('porPagina', this.tamanioPagina.toString());

    if (this.idSedeUsuario) params = params.set('idSede', this.idSedeUsuario.toString());
    if (this.filtroFechaIni) params = params.set('fechaIni', this.filtroFechaIni);
    if (this.filtroFechaFin) params = params.set('fechaFin', this.filtroFechaFin);

    this.http.get<any>(`${this.apiUrl}/historial`, { params }).subscribe({
      next: (data) => {
        this.historial = data.datos;
        this.totalRegistros = data.total;
        this.totalPaginas = Math.ceil(data.total / this.tamanioPagina);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar historial.';
        this.cargando = false;
      },
    });
  }

  /** Carga vehículos disponibles para el formulario de salida */
  cargarVehiculos(): void {
    const hoy = new Date().toISOString();
    const manana = new Date(Date.now() + 86400000).toISOString();
    this.comisionService
      .obtenerVehiculosDisponibles(hoy, manana, this.idSedeUsuario ?? undefined)
      .subscribe({ next: (data: any) => (this.vehiculos = data) });
  }

  /** Carga pilotos disponibles */
  cargarPilotos(): void {
    const hoy = new Date().toISOString();
    const manana = new Date(Date.now() + 86400000).toISOString();
    this.comisionService
      .obtenerPilotosDisponibles(hoy, manana)
      .subscribe({ next: (data: any) => (this.pilotos = data) });
  }

  /** Carga comisiones autorizadas o en curso para vincular */
  /** Carga comisiones autorizadas para vincular */
  cargarComisionesActivas(): void {
    this.comisionService.obtenerComisiones(1, 50, 181).subscribe({
      next: (data: any) => (this.comisiones = data.datos || []),
    });
  }
  // ─── Vistas ──────────────────────────────────────────────

  cambiarVista(vista: string): void {
    this.vistaActiva = vista;
    this.limpiarMensajes();
    if (vista === 'enRuta') this.cargarEnRuta();
    if (vista === 'historial') this.cargarHistorial();
  }

  // ─── Registrar salida ─────────────────────────────────────

  /** Registra la salida de un vehículo */
  registrarSalida(): void {
    if (!this.salidaIdVehiculo) {
      this.mensajeError = 'Seleccione un vehículo.';
      return;
    }

    this.cargando = true;
    this.http
      .post<any>(`${this.apiUrl}/salida`, {
        idVehiculo: this.salidaIdVehiculo,
        idPiloto: this.salidaIdPiloto || null,
        idComision: this.salidaIdComision || null,
        tipoMovimiento: this.salidaTipo,
        motivo: this.salidaMotivo || null,
      })
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.mensajeExito = `Salida registrada correctamente. Movimiento #${res.id}`;
          this.limpiarFormularioSalida();
          this.vistaActiva = 'enRuta';
          this.cargarEnRuta();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar la salida.';
          this.cargando = false;
        },
      });
  }

  /** Limpia el formulario de salida */
  limpiarFormularioSalida(): void {
    this.salidaIdVehiculo = 0;
    this.salidaIdPiloto = 0;
    this.salidaIdComision = null;
    this.salidaTipo = 'Comisión';
    this.salidaMotivo = '';
  }

  // ─── Registrar entrada ────────────────────────────────────

  /** Abre modal para registrar entrada de vehículo */
  abrirEntrada(movimiento: any): void {
    this.movimientoSeleccionado = movimiento;
    this.kmEntrada = 0;
    this.mostrarModalEntrada = true;
    this.limpiarMensajes();
  }

  /** Confirma la entrada del vehículo al predio */
  confirmarEntrada(): void {
    if (this.kmEntrada <= (this.movimientoSeleccionado?.kmSalida || 0)) {
      this.mensajeError = `El km de entrada debe ser mayor al de salida (${this.movimientoSeleccionado?.kmSalida} km).`;
      return;
    }
    if (this.kmEntrada < (this.movimientoSeleccionado?.kmSalida || 0)) {
      this.mensajeError = 'El km de entrada no puede ser menor al km de salida.';
      return;
    }

    this.cargando = true;
    this.mostrarModalEntrada = false;

    this.http
      .patch<any>(`${this.apiUrl}/${this.movimientoSeleccionado.id}/entrada`, {
        kmEntrada: this.kmEntrada,
      })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.mensajeExito = 'Entrada registrada correctamente.';
          this.cargarEnRuta();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar la entrada.';
          this.cargando = false;
        },
      });
  }

  // ─── Paginación ──────────────────────────────────────────

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarHistorial();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // ─── Helpers ─────────────────────────────────────────────

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

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
