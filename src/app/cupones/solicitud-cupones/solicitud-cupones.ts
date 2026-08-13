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
  asignacionesPendientes: { rango: any; cantidad: number; numeros: number[] }[] = [];

  // ── Inventario bodega agrupado para asignación ───────────
  rangosBodegaAgrupados: any[] = [];

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
    this.idSedeUsuario = this.authService.obtenerIdSede();
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

  sumarMonto = (acc: number, a: any) => acc + a.cantidad * a.rango.denominacion;
  /** Carga inventario de bodega agrupado por denominación */
  cargarRangosBodegaAgrupados(): void {
    this.cuponService.obtenerInventarioBodegaAgrupado().subscribe({
      next: (data) => {
        this.rangosBodegaAgrupados = data;
        this.cdr.detectChanges();
      },
    });
  }
  // ─── Paginación ───────────────────────────────────────────
  //
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

  /** Selecciona una denominación del inventario agrupado */
  seleccionarDenominacion(g: any): void {
    this.rangoSeleccionado = g;
    this.cantidadAsignar = 0;
    this.cdr.detectChanges();
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
    this.cargarRangosBodegaAgrupados();

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

  /** Agrega una asignación al listado pendiente con números de cupones calculados */
  agregarAsignacion(): void {
    if (!this.rangoSeleccionado || this.cantidadAsignar <= 0) {
      this.mensajeError = 'Seleccione una denominación e ingrese una cantidad válida.';
      return;
    }

    const disponibles = this.rangoSeleccionado.totalDisponibles;
    if (this.cantidadAsignar > disponibles) {
      this.mensajeError = `Solo hay ${disponibles} cupones disponibles en esa denominación.`;
      return;
    }

    // Verificar que no supere el monto solicitado
    const montoNuevo = this.cantidadAsignar * this.rangoSeleccionado.denominacion;
    if (this.montoAsignado + montoNuevo > (this.solicitudSeleccionada?.montoSolicitado ?? 0)) {
      this.mensajeError = `El monto total supera el solicitado (Q${this.solicitudSeleccionada?.montoSolicitado}.00).`;
      return;
    }

    // Calcular números de cupones a entregar — secuencial del menor al mayor
    // Se obtienen los rangos individuales de esa denominación ordenados por número
    const rangosIndividuales = this.rangosBodega
      .filter((r: any) => r.denominacion === this.rangoSeleccionado.denominacion)
      .sort((a: any, b: any) => a.numeroDel - b.numeroDel);

    const numerosAEntregar: number[] = [];
    let pendiente = this.cantidadAsignar;

    for (const rango of rangosIndividuales) {
      if (pendiente <= 0) break;
      const entregadosEnRango = rango.cantidad - rango.disponibles;
      const primerDisp = rango.numeroDel + entregadosEnRango;
      for (let i = primerDisp; i <= rango.numeroAl && pendiente > 0; i++) {
        numerosAEntregar.push(i);
        pendiente--;
      }
    }

    this.asignacionesPendientes.push({
      rango: this.rangoSeleccionado,
      cantidad: this.cantidadAsignar,
      numeros: numerosAEntregar,
    });

    this.rangoSeleccionado = null;
    this.cantidadAsignar = 0;
    this.mensajeError = '';
    // Recalcular monto total

    // totalMontoAsignado: number = 0;
  }

  /** Calcula el monto total de asignaciones pendientes */
  calcularMontoTotal(): number {
    return this.asignacionesPendientes.reduce(
      (acc, a) => acc + a.cantidad * a.rango.denominacion,
      0,
    );
  }
  eliminarAsignacion(index: number): void {
    const a = this.asignacionesPendientes[index];
    // Devolver disponibles al rango
    const rango = this.rangosBodega.find((r) => r.id === a.rango.id);
    if (rango) rango.disponibles += a.cantidad;
    this.asignacionesPendientes.splice(index, 1);
    // Recalcular monto total

    // Al final de agregarAsignacion, antes de detectChanges:
    this.asignacionesPendientes = [...this.asignacionesPendientes];
    this.cdr.detectChanges();
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
      // Obtener rangos individuales de esa denominación ordenados
      const rangosIndividuales = this.rangosBodega
        .filter((r: any) => r.denominacion === a.rango.denominacion)
        .sort((x: any, y: any) => x.numeroDel - y.numeroDel);

      let pendiente = a.cantidad;

      for (const rango of rangosIndividuales) {
        if (pendiente <= 0) break;

        const cantidadDeEsteRango = Math.min(pendiente, rango.disponibles);

        await this.cuponService
          .asignarCuponesPorMonto(this.solicitudSeleccionada!.id!, {
            idCompraDetalle: rango.id,
            cantidad: cantidadDeEsteRango,
          })
          .toPromise()
          .catch((err) => {
            this.mensajeError = err.error?.mensaje || 'Error al asignar cupones.';
            this.cargando = false;
          });

        pendiente -= cantidadDeEsteRango;
      }
    }

    this.cargando = false;
    this.asignacionesPendientes = [];
    this.mensajeExito = 'Cupones asignados correctamente.';
    this.cargarRangosBodega();
    this.cargarRangosBodegaAgrupados();

    // Recargar detalle para habilitar botón Finalizar
    this.cuponService.obtenerDetalleSolicitud(this.solicitudSeleccionada!.id!).subscribe({
      next: (data: any) => {
        this.detalleSolicitud = data;
        this.cdr.detectChanges();
      },
    });

    this.cdr.detectChanges();
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
      next: (res: any) => {
        this.mensajeExito = 'Solicitud finalizada correctamente.';
        // Si el backend devuelve URL del PDF, abrirlo
        if (res?.urlPdf) {
          window.open(`https://localhost:7069${res.urlPdf}`, '_blank');
        }
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
      (a: number, d: any) => a + d.disponibles * d.denominacion,
      0,
    );
  }
}
