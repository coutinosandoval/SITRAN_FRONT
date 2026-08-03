// ============================================================
// solicitud-cupones.ts
// Ruta: src/app/cupones/solicitud-cupones/solicitud-cupones.ts
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
import { CuponService } from '../../servicios/cupon.service';
import { AuthService } from '../../servicios/auth.service';
import { ModalComponent } from '../../shared/modal/modal';
import { SolicitudCupones, SolicitudCuponesDetalle } from '../../modelos/solicitud-cupones.model';

@Component({
  selector: 'app-solicitud-cupones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './solicitud-cupones.html',
})
export class SolicitudCuponesComponent implements OnInit {
  // ─── Listas ───
  solicitudes: SolicitudCupones[] = [];
  detalleSolicitud: SolicitudCuponesDetalle[] = [];
  rangosBodega: any[] = [];

  // ─── Paginación ───
  totalRegistros: number = 0;
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalPaginas: number = 0;
  filtroEstado: string = '';

  // ─── Roles ───
  esDelegado: boolean = false;
  esBodega: boolean = false;
  esAutoridad: boolean = false;
  esAdmin: boolean = false;
  idSedeUsuario: number | null = null;

  // ─── Visibilidad ───
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarAsignacion: boolean = false;

  // ─── Selección ───
  solicitudSeleccionada: SolicitudCupones | null = null;

  // ─── Formulario nueva solicitud ───
  formulario: FormGroup;

  // ─── Asignación de cupones (Bodega) ───
  rangoSeleccionado: any = null;
  cantidadAsignar: number = 0;
  asignacionesPendientes: { rango: any; cantidad: number }[] = [];

  // ─── Autorización ───
  observacionAutorizacion: string = '';
  rechazar: boolean = false;

  // ─── Modal ───
  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalTipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';
  modalBtnAceptar: string = 'Confirmar';
  modalConTexto: boolean = false;
  modalConNumero: boolean = false;
  modalAccion: (() => void) | null = null;

  // ─── Mensajes ───
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  // Estados disponibles
  estados = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'Pendiente Autorización', etiqueta: 'Pendiente Autorización' },
    { valor: 'Autorizada', etiqueta: 'Autorizada' },
    { valor: 'Rechazada', etiqueta: 'Rechazada' },
    { valor: 'Atendida', etiqueta: 'Atendida' },
  ];

  constructor(
    private cuponService: CuponService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.formulario = this.fb.group({
      monto: ['', [Validators.required, Validators.min(50)]],
      motivo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.esDelegado = this.authService.tienePermiso('SOLICITAR_CUPONES');
    this.esBodega = this.authService.tienePermiso('GESTIONAR_SOLICITUDES_CUPONES');
    this.esAutoridad = this.authService.tienePermiso('AUTORIZAR_SOLICITUDES_CUPONES');
    this.esAdmin = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.idSedeUsuario = this.authService.obtenerIdUnidad();
    this.cargarSolicitudes();
  }

  // ─── Cargar lista ─────────────────────────────────────────

  cargarSolicitudes(): void {
    this.cargando = true;
    const idSede = this.esDelegado ? (this.idSedeUsuario ?? undefined) : undefined;
    const estado = this.filtroEstado || undefined;

    this.cuponService
      .obtenerSolicitudesCupones(idSede, estado, this.paginaActual, this.tamanioPagina)
      .subscribe({
        next: (data: any) => {
          this.solicitudes = data.datos;
          this.totalRegistros = data.total;
          this.totalPaginas = Math.ceil(data.total / this.tamanioPagina);
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar solicitudes.';
          this.cargando = false;
        },
      });
  }

  // ─── Paginación ───────────────────────────────────────────

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarSolicitudes();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  // ─── Nueva solicitud (Delegado) ───────────────────────────

  abrirFormulario(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = true;
    this.formulario.reset();
    this.limpiarMensajes();
  }

  guardarSolicitud(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const monto = Number(this.formulario.value.monto);
    if (monto % 50 !== 0) {
      this.mensajeError = 'El monto debe ser múltiplo de Q50.00';
      return;
    }

    this.modalTitulo = 'Confirmar Solicitud';
    this.modalMensaje = `¿Confirma crear una solicitud por <strong>Q${monto.toLocaleString('es-GT')}.00</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Crear Solicitud';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarCrearSolicitud();
  }

  private _ejecutarCrearSolicitud(): void {
    this.cargando = true;
    const v = this.formulario.value;

    this.cuponService
      .crearSolicitudCupones({
        idSede: this.idSedeUsuario!,
        monto: Number(v.monto),
        motivo: v.motivo,
      })
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.mensajeExito = `Solicitud #${res.idSolicitud} creada correctamente.`;
          this.volverLista();
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al crear la solicitud.';
          this.cargando = false;
        },
      });
  }

  // ─── Ver detalle ──────────────────────────────────────────

  verDetalle(s: SolicitudCupones): void {
    this.solicitudSeleccionada = s;
    this.detalleSolicitud = [];
    this.mostrarLista = false;
    this.mostrarDetalle = true;
    this.limpiarMensajes();

    this.cuponService.obtenerDetalleSolicitud(s.id!).subscribe({
      next: (data: any) => {
        this.detalleSolicitud = data;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Autorizar (Autoridad Nacional) ──────────────────────

  autorizar(s: SolicitudCupones, aprobar: boolean): void {
    this.solicitudSeleccionada = s;
    this.rechazar = !aprobar;
    this.observacionAutorizacion = '';

    const accion = aprobar ? 'autorizar' : 'rechazar';
    this.modalTitulo = aprobar ? 'Autorizar Solicitud' : 'Rechazar Solicitud';
    this.modalMensaje = `¿Confirma ${accion} la solicitud #${s.id} de <strong>${s.sedeNombre}</strong> por <strong>Q${s.montoSolicitado}.00</strong>?`;
    this.modalTipo = aprobar ? 'confirmar' : 'peligro';
    this.modalBtnAceptar = aprobar ? 'Autorizar' : 'Rechazar';
    this.modalConTexto = true;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarAutorizar(aprobar);
  }

  private _ejecutarAutorizar(aprobar: boolean): void {
    this.cuponService
      .autorizarSolicitudCupones(this.solicitudSeleccionada!.id!, {
        aprobar,
        observacion: this.observacionAutorizacion,
      })
      .subscribe({
        next: () => {
          this.mensajeExito = `Solicitud ${aprobar ? 'autorizada' : 'rechazada'} correctamente.`;
          this.cargarSolicitudes();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al procesar la solicitud.';
        },
      });
  }

  // ─── Asignar cupones (Bodega) ─────────────────────────────

  abrirAsignacion(s: SolicitudCupones): void {
    this.solicitudSeleccionada = s;
    this.asignacionesPendientes = [];
    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.mostrarLista = false;
    this.mostrarAsignacion = true;
    this.limpiarMensajes();
    this.cargarRangosBodega();

    // Cargar detalle actual
    this.cuponService.obtenerDetalleSolicitud(s.id!).subscribe({
      next: (data: any) => {
        this.detalleSolicitud = data;
        this.cdr.detectChanges();
      },
    });
  }

  cargarRangosBodega(): void {
    this.cuponService.obtenerRangosBodega().subscribe({
      next: (data: any) => {
        this.rangosBodega = data;
        this.cdr.detectChanges();
      },
    });
  }

  agregarAsignacion(): void {
    if (!this.rangoSeleccionado || this.cantidadAsignar <= 0) {
      this.mensajeError = 'Seleccione un rango e ingrese una cantidad válida.';
      return;
    }
    if (this.cantidadAsignar > this.rangoSeleccionado.disponibles) {
      this.mensajeError = `Solo hay ${this.rangoSeleccionado.disponibles} cupones disponibles en ese rango.`;
      return;
    }

    this.asignacionesPendientes.push({
      rango: { ...this.rangoSeleccionado },
      cantidad: this.cantidadAsignar,
    });

    // Descontar disponibles del rango en pantalla
    this.rangoSeleccionado.disponibles -= this.cantidadAsignar;
    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.mensajeError = '';
  }

  eliminarAsignacion(index: number): void {
    const a = this.asignacionesPendientes[index];
    // Devolver disponibles al rango
    const rango = this.rangosBodega.find((r) => r.id === a.rango.id);
    if (rango) rango.disponibles += a.cantidad;
    this.asignacionesPendientes.splice(index, 1);
  }

  get montoAsignado(): number {
    return this.asignacionesPendientes.reduce(
      (acc, a) => acc + a.cantidad * a.rango.denominacion,
      0,
    );
  }

  confirmarAsignacion(): void {
    if (this.asignacionesPendientes.length === 0) {
      this.mensajeError = 'Debe agregar al menos un rango de cupones.';
      return;
    }

    this.modalTitulo = 'Confirmar Asignación';
    this.modalMensaje = `¿Confirma asignar cupones por <strong>Q${this.montoAsignado.toLocaleString('es-GT')}.00</strong> a la solicitud #${this.solicitudSeleccionada?.id}?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Confirmar Asignación';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarAsignacion();
  }

  private async _ejecutarAsignacion(): Promise<void> {
    this.cargando = true;

    for (const a of this.asignacionesPendientes) {
      await this.cuponService
        .asignarCuponesPorMonto(this.solicitudSeleccionada!.id!, {
          idCompraDetalle: a.rango.id,
          cantidad: a.cantidad,
        })
        .toPromise()
        .catch((err) => {
          this.mensajeError = err.error?.mensaje || 'Error al asignar cupones.';
          this.cargando = false;
        });
    }

    this.asignacionesPendientes = [];
    this.mensajeExito = 'Cupones asignados correctamente.';

    // Recargar detalle ANTES de limpiar y detectar cambios
    this.cuponService.obtenerDetalleSolicitud(this.solicitudSeleccionada!.id!).subscribe({
      next: (data: any) => {
        this.detalleSolicitud = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  finalizar(): void {
    this.modalTitulo = 'Finalizar Solicitud';
    this.modalMensaje = `¿Confirma finalizar la atención de la solicitud #${this.solicitudSeleccionada?.id}?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Finalizar';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarFinalizar();
  }

  private _ejecutarFinalizar(): void {
    this.cuponService.finalizarSolicitudCupones(this.solicitudSeleccionada!.id!, {}).subscribe({
      next: () => {
        this.mensajeExito = 'Solicitud finalizada correctamente.';
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al finalizar.';
      },
    });
  }

  // ─── Navegación ───────────────────────────────────────────

  volverLista(): void {
    this.mostrarLista = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarAsignacion = false;
    this.solicitudSeleccionada = null;
    this.limpiarMensajes();
  }

  // ─── Modal ────────────────────────────────────────────────

  onModalAceptar(evento: { texto?: string; numero?: number }): void {
    this.modalVisible = false;
    if (evento.texto) this.observacionAutorizacion = evento.texto;
    if (this.modalAccion) {
      this.modalAccion();
      this.modalAccion = null;
    }
  }

  onModalCancelar(): void {
    this.modalVisible = false;
    this.modalAccion = null;
  }

  // ─── Helpers ──────────────────────────────────────────────

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente Autorización':
        return 'bg-warning text-dark';
      case 'Autorizada':
        return 'bg-success';
      case 'Rechazada':
        return 'bg-danger';
      case 'Atendida':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  formatoQuetzales(monto: number): string {
    return `Q${monto.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  verPdf(urlPdf: string): void {
    window.open(`https://localhost:7069${urlPdf}`, '_blank');
  }

  /** Calcula el total disponible en quetzales */
calcularTotalDisponible(): number {
  return this.detalleSolicitud.reduce(
    (a: number, d: any) => a + (d.disponibles * d.denominacion), 0);
}
}
