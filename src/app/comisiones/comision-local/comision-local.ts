// ============================================================
// comision-local.ts
// Componente para gestión de comisiones locales
// Incluye: crear, asignar vehículo/piloto, autorizar, cerrar
// Ruta: src/app/comisiones/comision-local/comision-local.ts
// ============================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ComisionService } from '../../servicios/comision.service';
import { AuthService }     from '../../servicios/auth.service';

@Component({
  selector:    'app-comision-local',
  standalone:  true,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './comision-local.html',
})
export class ComisionLocalComponent implements OnInit {

  // ─── Listas ───
  comisiones:         any[] = [];
  unidades:           any[] = [];
  vehiculos:          any[] = [];
  pilotos:            any[] = [];

  // ─── Paginación ───
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;
  filtroEstado:   string = '';

  // ─── Visibilidad ───
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;

  // ─── Detalle seleccionado ───
  comisionSeleccionada: any = null;

  // ─── Modal rechazo ───
  mostrarModalRechazo: boolean = false;
  motivoRechazo:       string  = '';
  idRechazar:          number  = 0;

  // ─── Modal cierre ───
  mostrarModalCierre: boolean = false;
  idCerrar:           number  = 0;
  formularioCierre:   FormGroup;

  // ─── Modal asignación vehículo/piloto ───
  mostrarModalAsignacion: boolean = false;
  idAsignar:              number  = 0;
  formularioAsignacion:   FormGroup;

  // ─── Roles ───
  esDelegado:       boolean      = false;
  esAutoridadLocal: boolean      = false;
  idSedeUsuario:    number | null = null;

  // ─── Formulario nueva comisión ───
  formulario:     FormGroup;
  intentoGuardar: boolean = false;

  // ─── Estado ───
  cargando:     boolean = false;
  mensajeExito: string  = '';
  mensajeError: string  = '';

  constructor(
    private comisionService: ComisionService,
    private authService:     AuthService,
    private fb:              FormBuilder,
    private cdr:             ChangeDetectorRef,
  ) {
    // Formulario nueva comisión — sin destino, sin fechaFin, una sola autoridad
    this.formulario = this.fb.group({
      solicitante:         ['', Validators.required],
      idUnidad:            ['', Validators.required],
      departamentoSeccion: [''],
      fechaInicio:         ['', Validators.required],
      horaSalida:          ['', Validators.required],
      idVehiculo:          ['', Validators.required],
      idPiloto:            ['', Validators.required],
      kmInicial:           ['', Validators.required],
      motivo:              ['', Validators.required],
      observaciones:       [''],
      autoridad1Nombre:    [''],
      autoridad1Cargo:     [''],
    });

    // Formulario de asignación (editar vehículo/piloto mientras Pendiente)
    this.formularioAsignacion = this.fb.group({
      idVehiculo: ['', Validators.required],
      idPiloto:   ['', Validators.required],
      kmInicial:  ['', Validators.required],
    });

    // Formulario de cierre
    this.formularioCierre = this.fb.group({
      fechaFin:            ['', Validators.required],
      horaRetorno:         ['', Validators.required],
      kmFinal:             ['', Validators.required],
      observacionesCierre: [''],
    });
  }

  ngOnInit(): void {
    // Determinar rol del usuario logueado
    this.esDelegado       = this.authService.tienePermiso('VER_COMISIONES');
    this.esAutoridadLocal = this.authService.tienePermiso('GESTIONAR_COMISIONES_LOCALES');
    this.idSedeUsuario    = this.authService.obtenerIdUnidad();
    this.cargarComisiones();
    this.cargarUnidades();
    this.cargarVehiculos();
    this.cargarPilotos();
  }

  // ─── Carga de datos ──────────────────────────────────────

  /** Carga lista de comisiones locales filtradas por sede y estado */
  cargarComisiones(): void {
    this.cargando = true;
    const idSede  = this.idSedeUsuario ?? undefined;
    const estado  = this.filtroEstado || undefined;

    this.comisionService.obtenerComisionesLocales(
      idSede, estado, this.paginaActual, this.tamanioPagina
    ).subscribe({
      next: (data: any) => {
        this.comisiones     = data.datos;
        this.totalRegistros = data.total;
        this.totalPaginas   = Math.ceil(data.total / this.tamanioPagina);
        this.cargando       = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar comisiones locales.';
        this.cargando     = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Carga unidades para el selector */
  cargarUnidades(): void {
    this.comisionService.obtenerUnidades().subscribe({
      next: (data: any) => (this.unidades = data),
    });
  }

  /** Carga vehículos disponibles */
  cargarVehiculos(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.comisionService
      .obtenerVehiculosDisponibles(hoy, hoy, this.idSedeUsuario ?? undefined)
      .subscribe({
        next: (data: any) => (this.vehiculos = data),
      });
  }

  /** Carga pilotos disponibles */
  cargarPilotos(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.comisionService
      .obtenerPilotosDisponibles(hoy, hoy)
      .subscribe({
        next: (data: any) => (this.pilotos = data),
      });
  }

  // ─── Nueva comisión ──────────────────────────────────────

  /** Abre el formulario de nueva comisión local */
  mostrarNueva(): void {
    this.mostrarLista      = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle    = false;
    this.formulario.reset();
    this.intentoGuardar    = false;
    this.limpiarMensajes();
  }

  /** Guarda la nueva comisión local */
  guardar(): void {
    this.intentoGuardar = true;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const v       = this.formulario.value;

    this.comisionService.crearComisionLocal({
      idSede:          this.idSedeUsuario ?? undefined,
      solicitante:     v.solicitante,
      idUnidad:        v.idUnidad     ? Number(v.idUnidad)   : undefined,
      departamento:    v.departamentoSeccion || undefined,
      fechaInicio:     v.fechaInicio,
      horaSalida:      v.horaSalida,
      idVehiculo:      v.idVehiculo   ? Number(v.idVehiculo) : undefined,
      idPiloto:        v.idPiloto     ? Number(v.idPiloto)   : undefined,
      kmInicial:       v.kmInicial    ? Number(v.kmInicial)  : undefined,
      motivo:          v.motivo,
      observaciones:   v.observaciones || undefined,
      autoridadNombre: v.autoridad1Nombre || undefined,
      autoridadCargo:  v.autoridad1Cargo  || undefined,
    }).subscribe({
      next: (res: any) => {
        this.cargando     = false;
        this.mensajeExito = `Comisión local #${res.id} registrada correctamente.`;
        this.volverLista();
        this.cargarComisiones();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar la comisión local.';
        this.cargando     = false;
      },
    });
  }

  // ─── Ver detalle ─────────────────────────────────────────

  /** Carga y muestra el detalle de una comisión local */
  verDetalle(id: number): void {
    this.cargando = true;
    this.comisionService.obtenerComisionLocalPorId(id).subscribe({
      next: (data: any) => {
        this.comisionSeleccionada = data;
        this.mostrarLista         = false;
        this.mostrarFormulario    = false;
        this.mostrarDetalle       = true;
        this.cargando             = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el detalle.';
        this.cargando     = false;
      },
    });
  }

  // ─── Asignación vehículo/piloto ──────────────────────────

  /** Abre modal para editar vehículo y piloto */
  abrirAsignacion(c: any): void {
    this.idAsignar = c.id;
    this.formularioAsignacion.patchValue({
      idVehiculo: c.idVehiculo || '',
      idPiloto:   c.idPiloto   || '',
      kmInicial:  c.kmInicial  || '',
    });
    this.mostrarModalAsignacion = true;
    this.limpiarMensajes();
  }

  /** Guarda la asignación de vehículo y piloto */
  guardarAsignacion(): void {
    if (this.formularioAsignacion.invalid) {
      this.formularioAsignacion.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const v       = this.formularioAsignacion.value;

    this.comisionService.actualizarAsignacionLocal(this.idAsignar, {
      idVehiculo: Number(v.idVehiculo),
      idPiloto:   Number(v.idPiloto),
      kmInicial:  Number(v.kmInicial),
    }).subscribe({
      next: () => {
        this.cargando               = false;
        this.mostrarModalAsignacion = false;
        this.mensajeExito           = 'Asignación actualizada correctamente.';
        this.cargarComisiones();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al actualizar la asignación.';
        this.cargando     = false;
      },
    });
  }

  // ─── Autorizar / Rechazar ────────────────────────────────

  /** Autoriza una comisión local y genera PDF */
  autorizar(id: number): void {
    if (!confirm('¿Confirma autorizar esta comisión local?')) return;
    this.cargando = true;

    this.comisionService.autorizarComisionLocal(id, { aprobar: true }).subscribe({
      next: () => {
        this.cargando     = false;
        this.mensajeExito = 'Comisión local autorizada correctamente.';
        this.cargarComisiones();
        // Si estamos en detalle, recargar
        if (this.mostrarDetalle && this.comisionSeleccionada?.id === id) {
          this.verDetalle(id);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al autorizar.';
        this.cargando     = false;
      },
    });
  }

  /** Abre modal para ingresar motivo de rechazo */
  abrirRechazo(id: number): void {
    this.idRechazar          = id;
    this.motivoRechazo       = '';
    this.mostrarModalRechazo = true;
    this.limpiarMensajes();
  }

  /** Confirma el rechazo con motivo */
  confirmarRechazo(): void {
    if (!this.motivoRechazo.trim()) {
      this.mensajeError = 'Debe ingresar el motivo del rechazo.';
      return;
    }

    this.cargando            = true;
    this.mostrarModalRechazo = false;

    this.comisionService.autorizarComisionLocal(this.idRechazar, {
      aprobar:       false,
      motivoRechazo: this.motivoRechazo,
    }).subscribe({
      next: () => {
        this.cargando     = false;
        this.mensajeExito = 'Comisión local rechazada.';
        this.cargarComisiones();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al rechazar.';
        this.cargando     = false;
      },
    });
  }

  // ─── Cierre ──────────────────────────────────────────────

  /** Abre modal para cerrar la comisión */
  abrirCierre(id: number): void {
    this.idCerrar = id;
    this.formularioCierre.reset();
    this.mostrarModalCierre = true;
    this.limpiarMensajes();
  }

  /** Confirma el cierre de la comisión */
  confirmarCierre(): void {
    if (this.formularioCierre.invalid) {
      this.formularioCierre.markAllAsTouched();
      return;
    }

    this.cargando           = true;
    this.mostrarModalCierre = false;
    const v                 = this.formularioCierre.value;

    this.comisionService.cerrarComisionLocal(this.idCerrar, {
      fechaFin:            v.fechaFin,
      horaRetorno:         v.horaRetorno,
      kmFinal:             Number(v.kmFinal),
      observacionesCierre: v.observacionesCierre || undefined,
    }).subscribe({
      next: () => {
        this.cargando     = false;
        this.mensajeExito = 'Comisión local finalizada correctamente.';
        this.cargarComisiones();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al cerrar la comisión.';
        this.cargando     = false;
      },
    });
  }

  // ─── PDF ─────────────────────────────────────────────────

  /** Abre el PDF en una nueva pestaña */
  verPdf(urlPdf: string): void {
    window.open(`https://localhost:7069${urlPdf}`, '_blank');
  }

  // ─── Navegación ──────────────────────────────────────────

  volverLista(): void {
    this.mostrarLista         = true;
    this.mostrarFormulario    = false;
    this.mostrarDetalle       = false;
    this.comisionSeleccionada = null;
    this.limpiarMensajes();
  }

  // ─── Paginación ──────────────────────────────────────────

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarComisiones();
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarComisiones();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // ─── Helpers ─────────────────────────────────────────────

  tieneError(campo: string, form?: FormGroup): boolean {
    const f       = form || this.formulario;
    const control = f.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente':   return 'bg-warning text-dark';
      case 'Autorizada':  return 'bg-success';
      case 'Rechazada':   return 'bg-danger';
      case 'Finalizada':  return 'bg-secondary';
      default:            return 'bg-secondary';
    }
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }
}