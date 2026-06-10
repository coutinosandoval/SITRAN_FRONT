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
import {
  SolicitudTalonario,
  SolicitudTalonarioRequest,
  RechazarSolicitudTalonario,
  SolicitudTalonarioDetalle,
  DevolverCuponesBodega,
  TalonarioBodegaDisponible,
  AprobarSolicitudTalonarioRequest,
} from '../../modelos/cupon.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';
import { AuthService } from '../../servicios/auth.service';
import { ModalComponent } from '../../shared/modal/modal';

@Component({
  selector: 'app-solicitud-talonario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './solicitud-talonario.html',
})
export class SolicitudTalonarioComponent implements OnInit {
  // ─── Listas ───
  solicitudes: SolicitudTalonario[] = [];
  sedes: CatalogoItem[] = [];
  detalleSolicitud: SolicitudTalonarioDetalle[] = [];
  talonariosBodega: TalonarioBodegaDisponible[] = [];
  cuponesDisponiblesExpandido: number | null = null;
  cuponesDisponiblesLista: number[] = [];
  talonariosAsignados: { idTalonario: number; cantidad: number }[] = [];

  // ─── Paginación ───
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalRegistros: number = 0;
  totalPaginas: number = 0;
  filtroEstado: string = '';

  // ─── Resumen formulario ───
  resumenCantidad: number = 0;
  resumenValor: number = 100;
  resumenTotal: number = 0;
  cantidadCuponesInput: number = 0;

  // ─── Roles ───
  esDelegado: boolean = false;
  esCompras: boolean = false;
  esBodega: boolean = false;
  idSedeDelegado: number | null = null;
  nombreSedeDelegado: string = '';

  // ─── Selección ───
  solicitudSeleccionada: SolicitudTalonario | null = null;
  solicitudInfoSeleccionada: SolicitudTalonario | null = null;

  // ─── Visibilidad de vistas ───
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarAprobar: boolean = false;
  mostrarRechazar: boolean = false;
  mostrarCuponesInfo: boolean = false;
  mostrarDevolucion: boolean = false;

  // ─── Asignación bodega ───
  talonarioAsignando: TalonarioBodegaDisponible | null = null;
  cuponesAAsignar: number = 0;
  cuponesAsignadosTotal: number = 0;
  asignacionCompleta: boolean = false;

  // ─── Devolución sede ───
  detalleDevolviendo: SolicitudTalonarioDetalle | null = null;
  cuponesADevolver: number = 0;

  // ─── Modal ───
  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalTipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';
  modalBtnAceptar: string = 'Confirmar';
  modalConTexto: boolean = false;
  modalConNumero: boolean = false;
  modalLabelNumero: string = '';
  modalMaxNumero: number = 100;
  modalPlaceholder: string = '';
  modalAccion: (() => void) | null = null;

  Math = Math;

  estados = [
    { id: '', nombre: 'Todos' },
    { id: 'Pendiente', nombre: 'Pendiente' },
    { id: 'Aprobada', nombre: 'Aprobada' },
    { id: 'Rechazada', nombre: 'Rechazada' },
  ];

  valores = [50, 100];

  formulario: FormGroup;
  formularioRechazar: FormGroup;
  formularioDevolucion: FormGroup;

  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(
    private cuponService: CuponService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    this.formulario = this.fb.group({
      idSede: ['', Validators.required],
      cantidadCupones: ['', [Validators.required, Validators.min(1)]],
      valorCupon: [100, Validators.required],
      motivo: ['', Validators.required],
    });
    this.formularioRechazar = this.fb.group({
      justificacionRechazo: ['', Validators.required],
    });
    this.formularioDevolucion = this.fb.group({
      cuponesDevolver: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.esDelegado = this.authService.tieneRol('delegado');
    this.esCompras = this.authService.tieneRol('compras');
    this.esBodega = this.authService.tieneRol('bodega');
    this.idSedeDelegado = this.authService.obtenerIdUnidad();

    this.cargarSolicitudes();

    this.cuponService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes = data;
        if (this.esDelegado && this.idSedeDelegado) {
          const sede = this.sedes.find((s) => s.id === this.idSedeDelegado);
          this.nombreSedeDelegado = sede?.nombre || '';
        }
      },
    });
  }

  // ─── Carga de datos ───

  cargarSolicitudes(): void {
    this.cargando = true;
    this.cuponService
      .obtenerSolicitudesTalonario(
        this.paginaActual,
        this.tamanioPagina,
        this.filtroEstado || undefined,
        this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined,
      )
      .subscribe({
        next: (data) => {
          this.solicitudes = [...data.solicitudes];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas = data.totalPaginas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar solicitudes.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  cargarDetalleSolicitud(idSolicitud: number): void {
    this.cuponService.obtenerDetalleSolicitud(idSolicitud).subscribe({
      next: (data) => {
        this.detalleSolicitud = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar detalle de la solicitud.';
      },
    });
  }

  cargarTalonariosBodega(valorCupon: number): void {
    this.cuponService.obtenerTalonariosBodegaDisponibles(valorCupon).subscribe({
      next: (data) => {
        this.talonariosBodega = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar talonarios de bodega.';
      },
    });
  }

  // ─── Navegación ───

  ocultarTodo(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarAprobar = false;
    this.mostrarRechazar = false;
    this.mostrarCuponesInfo = false;
    this.mostrarDevolucion = false;
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  abrirFormulario(): void {
    this.ocultarTodo();
    this.mostrarFormulario = true;
    this.resumenCantidad = 0;
    this.resumenValor = 100;
    this.resumenTotal = 0;
    this.cantidadCuponesInput = 0;
    this.formulario.reset({ valorCupon: 100 });
    if (this.esDelegado && this.idSedeDelegado) {
      this.formulario.patchValue({ idSede: this.idSedeDelegado });
      this.formulario.get('idSede')?.disable();
    }
    this.limpiarMensajes();
  }

  onCantidadChange(val: number): void {
    this.cantidadCuponesInput = val;
    this.formulario.get('cantidadCupones')?.setValue(val);
    this.resumenCantidad = Number(val) || 0;
    this.resumenTotal = this.resumenCantidad * this.resumenValor;
  }

  onValorChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.resumenValor = val || 100;
    this.resumenTotal = this.resumenCantidad * this.resumenValor;
  }

  verDetalle(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.ocultarTodo();
    this.mostrarDetalle = true;
    if (s.estado === 'Aprobada') {
      if (this.esBodega) {
        this.cargarTalonariosBodega(s.valorCupon);
      } else {
        this.cargarDetalleSolicitud(s.id);
      }
    }
    this.limpiarMensajes();
  }

  abrirAprobar(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.ocultarTodo();
    this.mostrarAprobar = true;
    this.talonarioAsignando = null;
    this.cuponesAAsignar = 0;
    this.cuponesAsignadosTotal = 0;
    this.asignacionCompleta = false;
    this.detalleSolicitud = [];
    this.talonariosAsignados = [];
    this.cargarTalonariosBodega(s.valorCupon);
    this.cargarDetalleSolicitud(s.id);
    this.limpiarMensajes();
  }

  abrirRechazar(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.ocultarTodo();
    this.mostrarRechazar = true;
    this.formularioRechazar.reset();
    this.limpiarMensajes();
  }

  verCuponesInfo(s: SolicitudTalonario): void {
    this.solicitudInfoSeleccionada = s;
    this.ocultarTodo();
    this.mostrarCuponesInfo = true;
    this.detalleSolicitud = [];
    this.cargarDetalleSolicitud(s.id);
    this.limpiarMensajes();
  }

  abrirDevolucion(detalle: SolicitudTalonarioDetalle): void {
    this.detalleDevolviendo = detalle;
    this.mostrarDevolucion = true;
    this.cuponesADevolver = 0;
    this.formularioDevolucion.reset();
    this.limpiarMensajes();
  }

  volverLista(): void {
    this.ocultarTodo();
    this.mostrarLista = true;
    this.limpiarMensajes();
  }

  // ─── Acciones con modal ───

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.modalTitulo = 'Confirmar Solicitud';
    this.modalMensaje = `¿Está seguro que desea enviar la solicitud de <strong>${v.cantidadCupones}</strong> cupones de <strong>Q${v.valorCupon}.00</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Enviar Solicitud';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarGuardar();
  }

  private _ejecutarGuardar(): void {
    this.cargando = true;
    const v = this.formulario.getRawValue();
    const dto: SolicitudTalonarioRequest = {
      idSede: Number(v.idSede),
      cantidadCupones: Number(v.cantidadCupones),
      valorCupon: Number(v.valorCupon),
      motivo: v.motivo,
    };
    this.cuponService.agregarSolicitudTalonario(dto).subscribe({
      next: () => {
        this.cargando = false;
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al enviar la solicitud.';
        this.cargando = false;
      },
    });
  }

  asignarCupones(): void {
    if (!this.solicitudSeleccionada || !this.talonarioAsignando) return;
    if (this.cuponesAAsignar <= 0) {
      this.mensajeError = 'Ingrese una cantidad válida de cupones.';
      return;
    }
    const cuponesRestantes =
      this.solicitudSeleccionada.cantidadCupones - this.cuponesAsignadosTotal;
    if (this.cuponesAAsignar > cuponesRestantes) {
      this.mensajeError = `Solo faltan ${cuponesRestantes} cupones por asignar.`;
      return;
    }
    if (this.cuponesAAsignar > this.talonarioAsignando.saldo) {
      this.mensajeError = `El talonario solo tiene ${this.talonarioAsignando.saldo} cupones disponibles.`;
      return;
    }
    this.modalTitulo = 'Confirmar Asignación';
    this.modalMensaje = `¿Confirma asignar <strong>${this.cuponesAAsignar}</strong> cupones del <strong>${this.talonarioAsignando.nombre}</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Confirmar Asignación';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarAsignacion();
  }

  private _ejecutarAsignacion(): void {
    const t = this.talonarioAsignando!;

    const existente = this.talonariosAsignados.find((x) => x.idTalonario === t.id);
    if (existente) {
      existente.cantidad += this.cuponesAAsignar;
    } else {
      this.talonariosAsignados.push({ idTalonario: t.id, cantidad: this.cuponesAAsignar });
    }

    const enDetalle = this.detalleSolicitud.find((d) => d.idTalonario === t.id);
    if (enDetalle) {
      enDetalle.cuponesAsignados += this.cuponesAAsignar;
    } else {
      this.detalleSolicitud.push({
        id: t.id,
        idSolicitud: this.solicitudSeleccionada!.id,
        idTalonario: t.id,
        nombreTalonario: t.nombre,
        valorCupon: this.solicitudSeleccionada!.valorCupon,
        cuponesAsignados: this.cuponesAAsignar,
        cuponesDevueltos: 0,
        cuponesEntregados: 0,
        estado: 'Pendiente',
        fechaAsignacion: new Date().toISOString(),
      });
    }

    t.saldo -= this.cuponesAAsignar;
    this.cuponesAsignadosTotal += this.cuponesAAsignar;
    this.talonarioAsignando = null;
    this.cuponesAAsignar = 0;
    this.mensajeError = '';

    if (this.cuponesAsignadosTotal >= this.solicitudSeleccionada!.cantidadCupones) {
      this.asignacionCompleta = true;
    }
    this.cdr.detectChanges();
  }

  finalizarAsignacion(): void {
    if (!this.solicitudSeleccionada) return;
    this.modalTitulo = 'Finalizar Asignación';
    this.modalMensaje = `¿Confirma que se han asignado todos los cupones de la <strong>Solicitud #${this.solicitudSeleccionada.id}</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Finalizar';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarFinalizar();
  }

  private _ejecutarFinalizar(): void {
    const usuario = this.authService.obtenerNombre();
    const dto: AprobarSolicitudTalonarioRequest = {
      talonarios: this.talonariosAsignados,
      nombreEntregador: usuario,
      nombreReceptor: this.solicitudSeleccionada!.creadoPor || '',
    };
    this.cuponService.aprobarSolicitudTalonario(this.solicitudSeleccionada!.id, dto).subscribe({
      next: () => {
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al finalizar la asignación.';
      },
    });
  }

  guardarRechazo(): void {
    if (this.formularioRechazar.invalid) {
      this.formularioRechazar.markAllAsTouched();
      return;
    }
    this.modalTitulo = 'Rechazar Solicitud';
    this.modalMensaje = `¿Está seguro que desea rechazar la <strong>Solicitud #${this.solicitudSeleccionada!.id}</strong> — <strong>${this.solicitudSeleccionada!.nombreSede}</strong>?`;
    this.modalTipo = 'peligro';
    this.modalBtnAceptar = 'Rechazar';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarRechazo();
  }

  private _ejecutarRechazo(): void {
    const dto: RechazarSolicitudTalonario = {
      justificacionRechazo: this.formularioRechazar.value.justificacionRechazo,
    };
    this.cuponService.rechazarSolicitudTalonario(this.solicitudSeleccionada!.id, dto).subscribe({
      next: () => {
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al rechazar la solicitud.';
      },
    });
  }

  guardarDevolucion(): void {
    if (this.formularioDevolucion.invalid) {
      this.formularioDevolucion.markAllAsTouched();
      return;
    }
    if (!this.detalleDevolviendo) return;
    const disponibles = this.cuponesDisponiblesDetalle(this.detalleDevolviendo);
    const cantidad = Number(this.formularioDevolucion.value.cuponesDevolver);
    if (cantidad > disponibles) {
      this.mensajeError = `Solo puede devolver hasta ${disponibles} cupones.`;
      return;
    }
    this.modalTitulo = 'Devolver Cupones a Bodega';
    this.modalMensaje = `¿Confirma devolver <strong>${cantidad}</strong> cupones del <strong>${this.detalleDevolviendo.nombreTalonario}</strong> a Bodega?`;
    this.modalTipo = 'devolucion';
    this.modalBtnAceptar = 'Confirmar Devolución';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarDevolucion(cantidad);
  }

  private _ejecutarDevolucion(cantidad: number): void {
    const dto: DevolverCuponesBodega = { cupones: cantidad };
    this.cuponService.devolverCuponesABodega(this.detalleDevolviendo!.id, dto).subscribe({
      next: () => {
        this.mostrarDevolucion = false;
        this.detalleDevolviendo = null;
        if (this.solicitudInfoSeleccionada) {
          this.cargarDetalleSolicitud(this.solicitudInfoSeleccionada.id);
        }
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al devolver cupones.';
      },
    });
  }

  onModalAceptar(evento: { texto?: string; numero?: number }): void {
    this.modalVisible = false;
    if (this.modalAccion) {
      this.modalAccion();
      this.modalAccion = null;
    }
  }

  onModalCancelar(): void {
    this.modalVisible = false;
    this.modalAccion = null;
  }

  // ─── Paginación ───

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarSolicitudes();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // ─── Helpers ───

  tieneError(campo: string, form: FormGroup = this.formulario): boolean {
    const control = form.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  colorEstado(estado?: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-warning text-dark';
      case 'Aprobada':
        return 'bg-success';
      case 'Rechazada':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  get cuponesRestantes(): number {
    if (!this.solicitudSeleccionada) return 0;
    return this.solicitudSeleccionada.cantidadCupones - this.cuponesAsignadosTotal;
  }

  cuponesDisponiblesDetalle(detalle: SolicitudTalonarioDetalle): number {
    return this.detalleSolicitud
      .filter((d) => d.idTalonario === detalle.idTalonario && d.estado === 'Asignado')
      .reduce((sum, d) => sum + (d.cuponesAsignados - d.cuponesDevueltos), 0);
  }

  detectarCambios(): void {
    this.cdr.detectChanges();
  }

  toggleCuponesDisponibles(idDetalle: number): void {
    if (this.cuponesDisponiblesExpandido === idDetalle) {
      this.cuponesDisponiblesExpandido = null;
      this.cuponesDisponiblesLista = [];
      return;
    }
    this.cuponService.obtenerCuponesDisponiblesDetalle(idDetalle).subscribe({
      next: (data) => {
        this.cuponesDisponiblesLista = data;
        this.cuponesDisponiblesExpandido = idDetalle;
        this.cdr.detectChanges();
      },
    });
  }

  actualizarCantidad(val: string): void {
    this.resumenCantidad = Number(val) || 0;
    this.resumenTotal = this.resumenCantidad * this.resumenValor;
    this.formulario.get('cantidadCupones')?.setValue(this.resumenCantidad);
    this.cdr.detectChanges();
  }

  actualizarValor(val: string): void {
    this.resumenValor = Number(val) || 100;
    this.resumenTotal = this.resumenCantidad * this.resumenValor;
    this.cdr.detectChanges();
  }
}
