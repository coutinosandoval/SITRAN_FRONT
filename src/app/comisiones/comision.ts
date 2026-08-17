import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ComisionService } from '../servicios/comision.service';
import { CuponService } from '../servicios/cupon.service';
import {
  Comision,
  ComisionRequest,
  ComisionDetalle,
  EstadoComision,
  EstadisticaComision,
  ComisionPersona,
  HistorialComision,
  ChecklistComision,
} from '../modelos/comision.model';
import { CatalogoItem } from '../modelos/vehiculo.model';
import { AuthService } from '../servicios/auth.service';
import { ModalComponent } from '../shared/modal/modal';
import { NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-comision',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './comision.html',
})
export class ComisionComponent implements OnInit {
  // ─── Lista ───
  comisiones: Comision[] = [];
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalRegistros: number = 0;
  totalPaginas: number = 0;

  // ─── Filtros ───
  filtroEstado: number = 0;
  filtroTipo: string = '';
  filtroSolicitante: string = '';
  filtroDestino: string = '';

  // ─── Catálogos ───
  estados: EstadoComision[] = [];
  unidades: CatalogoItem[] = [];
  vehiculos: CatalogoItem[] = [];
  pilotos: CatalogoItem[] = [];
  talonariosDisponibles: CatalogoItem[] = [];
  estadisticas: EstadisticaComision[] = [];

  // ─── Devolución de cupones por piloto ───
  mostrarDevolucionCupones: boolean = false;
  cuponesADevolver: number = 0;
  totalSeleccionados: number = 0;
  kmInicialVehiculo: number = 0;
  // URL del PDF de combustible vinculado a la comisión
  urlPdfCombustible: string = '';
  solicitudCombustibleDetalle: any[] = [];
  idSolicitudCombustible: number = 0;
  mostrarModalDevolucionComb: boolean = false;
  detalleDevolucionComb: any = null;
  cantidadDevolverComb: number = 0;
  // ─── Tipos ───
  tipos = ['Local', 'Nacional', 'Regional'];

  // ─── Control de vistas ───
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarChecklist: boolean = false;
  mostrarAsignarCupones: boolean = false;
  mostrarFinalizar: boolean = false;
  esDelegado: boolean = false;
  tieneCuponesAsignados: boolean = false;

  cuponesSeleccionados: number[] = [];
  mostrarSeleccionCupones: boolean = false;

  // ─── Reasignación piloto/vehículo ───
  mostrarReasignar: boolean = false;
  idVehiculoReasignar: number = 0;
  idPilotoReasignar: number = 0;

  // ─── Detalle ───
  comisionDetalle: ComisionDetalle | null = null;
  personas: ComisionPersona[] = [];
  historial: HistorialComision[] = [];
  checklist: ChecklistComision | null = null;
  cuponesComision: any[] = [];
  idSedeDelegado: number | null = null;

  // ─── Formulario personas ───
  personasFormulario: string[] = [''];
  nuevaPersona: string = '';

  // ─── Cupones ───
  idTalonarioSeleccionado: number = 0;

  // ─── Formularios ───
  formulario: FormGroup;
  formularioChecklist: FormGroup;
  formularioFinalizar: FormGroup;

  // ─── Mensajes ───
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  // ─── Combustible en checklist ───
  necesitaCombustible: boolean = false;
  cuponesChecklistAgregados: any[] = [];
  rangoChecklistSeleccionado: any = null;
  cantidadChecklistAsignar: number = 0;
  cuponesDisponiblesChecklist: any[] = [];
  // Cupones individuales para devolución
  cuponesIndividualesDevolucion: { numero: number; seleccionado: boolean }[] = [];

  // ─── Modal estado ───
  mostrarModalEstado: boolean = false;
  nuevoEstado: number = 0;
  justificacionEstado: string = '';

  // ─── Control del modal reutilizable ───
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

  // ─── Devolución de cupones por piloto ───
  cuponesEntregados: number = 0;

  constructor(
    private comisionService: ComisionService,
    private cuponService: CuponService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private authService: AuthService,
    private ngZone: NgZone,
    private http: HttpClient,
  ) {
    this.formularioChecklist = this.fb.group({
      idVehiculo: ['', Validators.required],
      idPiloto: ['', Validators.required],
      fechaRevision: ['', Validators.required],
      horaRevision: ['', Validators.required],
      observaciones: [''],
    });
    // Formulario nueva comisión
    this.formulario = this.fb.group({
      tipoComision: ['', Validators.required],
      solicitante: ['', Validators.required],
      idUnidad: ['', Validators.required],
      departamentoSeccion: [''],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      horaSalida: ['', Validators.required],
      duracionAproximada: [''],
      destino: ['', Validators.required],
      motivo: ['', Validators.required],
      observaciones: [''],
      autoridad1Nombre: [''],
      autoridad1Cargo: [''],
      autoridad2Nombre: [''],
      autoridad2Cargo: [''],
      autoridad3Nombre: [''],
      autoridad3Cargo: [''],
    });

    // Formulario finalización de comisión
    this.formularioFinalizar = this.fb.group({
      kilometrajeFinal: ['', Validators.required],
      fechaRetorno: ['', Validators.required],
      horaRetorno: ['', Validators.required],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    this.esDelegado = this.authService.tienePermiso('GESTIONAR_COMISIONES_SEDE');
    this.idSedeDelegado = this.authService.obtenerIdUnidad();

    this.cargarComisiones();
    this.cargarEstados();
    this.cargarUnidades();
    this.cargarEstadisticas();
  }

  // ─── Carga de datos ───

  cargarComisiones(): void {
    this.cargando = true;
    this.comisionService
      .obtenerComisiones(
        this.paginaActual,
        this.tamanioPagina,
        this.filtroEstado || undefined,
        this.filtroTipo || undefined,
        this.filtroSolicitante || undefined,
        this.filtroDestino || undefined,
        undefined,
        undefined,
        this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined,
      )
      .subscribe({
        next: (data) => {
          this.comisiones = [...data.comisiones];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas = data.totalPaginas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar comisiones.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }
  cargarEstados(): void {
    this.comisionService.obtenerEstados().subscribe({ next: (data) => (this.estados = data) });
  }

  cargarUnidades(): void {
    this.comisionService.obtenerUnidades().subscribe({ next: (data) => (this.unidades = data) });
  }

  cargarEstadisticas(): void {
    this.comisionService
      .obtenerEstadisticas()
      .subscribe({ next: (data) => (this.estadisticas = data) });
  }

  // Carga vehículos y pilotos disponibles para el formulario de nueva comisión
  cargarVehiculosYPilotos(): void {
    const fi = this.formulario.get('fechaInicio')?.value;
    const ff = this.formulario.get('fechaFin')?.value;
    if (!fi || !ff) return;
    const idSede = this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined;
    this.comisionService
      .obtenerVehiculosDisponibles(fi, ff, idSede)
      .subscribe({ next: (data) => (this.vehiculos = data) });
    this.comisionService
      .obtenerPilotosDisponibles(fi, ff)
      .subscribe({ next: (data) => (this.pilotos = data) });
  }

  // Carga vehículos y pilotos disponibles para el checklist
  cargarVehiculosYPilotosChecklist(): void {
    if (!this.comisionDetalle) return;
    const fi = this.comisionDetalle.comision.fechaInicio || '';
    const ff = this.comisionDetalle.comision.fechaFin || '';
    const idSede = this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined;
    this.comisionService
      .obtenerVehiculosDisponibles(fi, ff, idSede)
      .subscribe({ next: (data) => (this.vehiculos = data) });
    this.comisionService
      .obtenerPilotosDisponibles(fi, ff)
      .subscribe({ next: (data) => (this.pilotos = data) });
  }

  // Carga talonarios disponibles usando CuponService
  cargarTalonariosDisponibles(): void {
    const idSede = this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined;
    this.cuponService.obtenerTalonariosDisponibles(idSede).subscribe({
      next: (data) => {
        console.log('Talonarios:', JSON.stringify(data));
        this.talonariosDisponibles = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar talonarios.';
      },
    });
  }

  // Carga cupones asignados a la comisión actual
  cargarCuponesComision(): void {
    if (!this.comisionDetalle) return;
    this.comisionService.obtenerCuponesComision(this.comisionDetalle.comision.id).subscribe({
      next: (data) => {
        this.cuponesComision = data;
        this.tieneCuponesAsignados = data.length > 0;
        console.log('Cupones cargados:', data.length);
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Navegación ───

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarComisiones();
  }

  limpiarFiltros(): void {
    this.filtroEstado = 0;
    this.filtroTipo = '';
    this.filtroSolicitante = '';
    this.filtroDestino = '';
    this.filtrar();
  }

  abrirFormulario(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
    this.mostrarChecklist = false;
    this.personasFormulario = [''];
    this.formulario.reset();
    this.limpiarMensajes();
  }

  verDetalle(id: number): void {
    this.comisionService.obtenerPorId(id).subscribe({
      next: (data) => {
        console.log('Estado:', data.comision.idEstado);
        console.log('Cupones:', this.cuponesComision.length);
        this.comisionDetalle = data;
        this.personas = data.personas;
        this.historial = data.historial;
        this.mostrarLista = false;
        this.mostrarFormulario = false;
        this.mostrarDetalle = true;
        this.mostrarChecklist = false;
        this.mostrarFinalizar = false;
        this.mostrarAsignarCupones = false;
        this.cargarCuponesComision();
        this.cdr.detectChanges();
        this.cargarPdfCombustible(id);
      },
      error: () => {
        this.mensajeError = 'Error al cargar el detalle.';
      },
    });
  }

  abrirChecklist(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarChecklist = true;
    this.cargarVehiculosYPilotosChecklist();
    this.formularioChecklist.reset({
      fechaRevision: this.comisionDetalle?.comision.fechaInicio?.split('T')[0] || '',
      horaRevision: this.comisionDetalle?.comision.horaSalida || '',
    });
    this.limpiarMensajes();
  }

  // Abre o cierra el panel de asignación de cupones
  abrirAsignarCupones(): void {
    this.mostrarAsignarCupones = !this.mostrarAsignarCupones;
    if (this.mostrarAsignarCupones) {
      this.cargarTalonariosDisponibles();
      this.cargarCuponesComision();
    }
  }

  volverLista(): void {
    this.mostrarLista = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarChecklist = false;
    this.mostrarAsignarCupones = false;
    this.mostrarFinalizar = false;
    this.comisionDetalle = null;
    this.limpiarMensajes();
    this.cargarComisiones(); // ← agrega esta línea
  }

  volverDetalle(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = true;
    this.mostrarChecklist = false;
    this.mostrarFinalizar = false;
    this.limpiarMensajes();
  }

  // ─── Personas ───

  agregarCampoPersona(): void {
    this.personasFormulario.push('');
  }

  eliminarCampoPersona(index: number): void {
    this.personasFormulario.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  agregarPersonaDetalle(): void {
    if (!this.nuevaPersona.trim()) return;
    this.comisionService
      .agregarPersona(this.comisionDetalle!.comision.id, { nombrePersona: this.nuevaPersona })
      .subscribe({
        next: () => {
          this.nuevaPersona = '';
          this.verDetalle(this.comisionDetalle!.comision.id);
        },
        error: () => {
          this.mensajeError = 'Error al agregar persona.';
        },
      });
  }
  eliminarPersona(id: number): void {
    if (!confirm('¿Eliminar esta persona?')) return;
    this.comisionService.eliminarPersona(id).subscribe({
      next: () => this.verDetalle(this.comisionDetalle!.comision.id),
      error: () => {
        this.mensajeError = 'Error al eliminar persona.';
      },
    });
  }

  // ─── Estado ───

  abrirModalEstado(idEstado: number): void {
    this.nuevoEstado = idEstado;
    this.justificacionEstado = '';
    this.mostrarModalEstado = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
  }

  confirmarCambioEstado(): void {
    if (!this.comisionDetalle) return;
    this.comisionService
      .cambiarEstado(this.comisionDetalle.comision.id, {
        idEstado: this.nuevoEstado,
        justificacion: this.justificacionEstado,
      })
      .subscribe({
        next: () => {
          this.mostrarModalEstado = false;
          this.verDetalle(this.comisionDetalle!.comision.id);
          this.cargarEstadisticas();
        },
        error: () => {
          this.mensajeError = 'Error al cambiar el estado.';
        },
      });
  }

  // ─── Firmas ───

  registrarFirma(autoridad: number): void {
    if (!this.comisionDetalle) return;
    if (!confirm(`¿Confirma registrar la firma de la Autoridad ${autoridad}?`)) return;
    this.comisionService.registrarFirma(this.comisionDetalle.comision.id, autoridad).subscribe({
      next: () => {
        this.verDetalle(this.comisionDetalle!.comision.id);
        this.cargarEstadisticas();
      },
      error: () => {
        this.mensajeError = 'Error al registrar la firma.';
      },
    });
  }

  // ─── Guardar comisión ───

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.value;

    // Validar hora de salida si la fecha es hoy
    if (v.horaSalida && v.fechaInicio) {
      const hoy = new Date();
      const fechaForm = new Date(v.fechaInicio + 'T00:00:00');
      const esHoy = hoy.toDateString() === fechaForm.toDateString();

      if (esHoy) {
        const [horas, minutos] = v.horaSalida.split(':').map(Number);
        const horaSalidaDate = new Date();
        horaSalidaDate.setHours(horas, minutos, 0, 0);
        if (horaSalidaDate <= hoy) {
          this.mensajeError = 'La hora de salida debe ser mayor a la hora actual.';
          return;
        }
      }
    }

    if (!confirm('¿Está seguro que desea registrar esta comisión?')) return;

    this.cargando = true;
    const dto: ComisionRequest = {
      tipoComision: v.tipoComision,
      solicitante: v.solicitante,
      idUnidad: Number(v.idUnidad),
      idSede: this.esDelegado ? (this.idSedeDelegado ?? undefined) : undefined,
      departamentoSeccion: v.departamentoSeccion,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      horaSalida: v.horaSalida,
      duracionAproximada: v.duracionAproximada,
      destino: v.destino,
      motivo: v.motivo,
      observaciones: v.observaciones,
      autoridad1Nombre: v.autoridad1Nombre,
      autoridad1Cargo: v.autoridad1Cargo,
      autoridad2Nombre: v.autoridad2Nombre,
      autoridad2Cargo: v.autoridad2Cargo,
      autoridad3Nombre: v.autoridad3Nombre,
      autoridad3Cargo: v.autoridad3Cargo,
      personas: this.personasFormulario.filter((p) => p.trim() !== ''),
    };

    this.comisionService.agregar(dto).subscribe({
      next: () => {
        this.cargando = false;
        alert('Comisión registrada correctamente.');
        this.volverLista();
        this.cargarComisiones();
        this.cargarEstadisticas();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar la comisión.';
        this.cargando = false;
      },
    });
  }

  // ─── Guardar checklist ───

  guardarChecklist(): void {
    if (this.formularioChecklist.invalid) {
      this.formularioChecklist.markAllAsTouched();
      return;
    }

    if (!confirm('¿Confirma asignar vehículo y piloto? La comisión pasará a En Curso.')) return;

    const v = this.formularioChecklist.value;

    // Declarar dto con los campos del formulario
    const dto: ChecklistComision = {
      idVehiculo: Number(v.idVehiculo),
      idPiloto: Number(v.idPiloto),
      fechaRevision: v.fechaRevision,
      horaRevision: v.horaRevision,
      observaciones: v.observaciones,
    };

    this.comisionService.registrarChecklist(this.comisionDetalle!.comision.id, dto).subscribe({
      next: () => {
        if (this.necesitaCombustible && this.cuponesChecklistAgregados.length > 0) {
          this._crearSolicitudCombustibleChecklist(
            this.comisionDetalle!.comision.id,
            Number(v.idVehiculo),
            Number(v.idPiloto),
          );
        } else {
          this.mensajeExito = 'Vehículo y piloto asignados. Comisión en curso.';
          this.verDetalle(this.comisionDetalle!.comision.id);
          this.cargarEstadisticas();
        }
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar.';
      },
    });
  }

  /** Crea solicitud de combustible vinculada a la comisión */
  private _crearSolicitudCombustibleChecklist(
    idComision: number,
    idVehiculo: number,
    idPiloto: number,
  ): void {
    // Crear la solicitud de combustible con los datos de la comisión
    this.http
      .post<any>(`${environment.apiUrl}/api/solicitud-combustible`, {
        idSede: this.idSedeDelegado,
        idVehiculo: idVehiculo,
        idPiloto: idPiloto,
        solicitante: this.comisionDetalle!.comision.solicitante,
        observaciones: 'Combustible asignado desde comisión #' + idComision,
        idComision: idComision,
      })
      .subscribe({
        next: (res) => {
          // Agregar cupones en secuencia
          this._agregarCuponesChecklistSecuencial(res.id, 0);
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al crear solicitud de combustible.';
        },
      });
  }

  /** Agrega cupones de checklist en secuencia */
  private _agregarCuponesChecklistSecuencial(idSolicitud: number, index: number): void {
    if (index >= this.cuponesChecklistAgregados.length) {
      // Autorizar automáticamente — la comisión ya fue autorizada
      this.http
        .patch<any>(`${environment.apiUrl}/api/solicitud-combustible/${idSolicitud}/autorizar`, {})
        .subscribe({
          next: () => {
            this.mensajeExito = 'Vehículo, piloto y cupones asignados. Comisión en curso.';
            this.cuponesChecklistAgregados = [];
            this.necesitaCombustible = false;
            this.verDetalle(this.comisionDetalle!.comision.id);
            this.cargarEstadisticas();
          },
          error: () => {
            this.mensajeExito = 'Checklist guardado. Error al autorizar combustible.';
            this.verDetalle(this.comisionDetalle!.comision.id);
          },
        });
      return;
    }

    const c = this.cuponesChecklistAgregados[index];
    this.http
      .post<any>(`${environment.apiUrl}/api/solicitud-combustible/${idSolicitud}/detalle`, {
        idSolCuponDet: c.rango.id,
        denominacion: c.rango.denominacion,
        cantidad: c.cantidad,
        numeroDel: c.rango.numeroDel,
        numeroAl: c.rango.numeroAl,
      })
      .subscribe({
        next: () => this._agregarCuponesChecklistSecuencial(idSolicitud, index + 1),
        error: (err) => {
          console.error('Error al autorizar combustible:', err);
          this.mensajeExito = 'Checklist guardado. Error al autorizar combustible.';
          this.verDetalle(this.comisionDetalle!.comision.id);
        },
      });
  }

  // ─── Asignación de cupones ───

  // Asigna cupones automáticamente según monto de combustible
  asignarCupones(): void {
    if (!this.idTalonarioSeleccionado || this.idTalonarioSeleccionado === 0) {
      this.mensajeError = 'Debe seleccionar un talonario.';
      return;
    }
    if (!confirm('¿Confirma asignar los cupones a esta comisión?')) return;

    this.comisionService
      .asignarCuponesComision(
        this.comisionDetalle!.comision.id,
        Number(this.idTalonarioSeleccionado),
      )
      .subscribe({
        next: (res) => {
          alert(res.mensaje);
          this.cargarCuponesComision();
          this.idTalonarioSeleccionado = 0;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al asignar cupones.';
        },
      });
  }

  // ─── Paginación ───

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarComisiones();
  }

  // ─── Utilidades ───

  tieneError(campo: string, form: FormGroup = this.formulario): boolean {
    const control = form.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Verifica si la fecha ya venció
  esFechaVencida(fecha?: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }

  // Verifica si la fecha y hora de salida de la comisión ya vencieron
  esFechaHoraVencida(): boolean {
    if (!this.comisionDetalle) return false;
    const fi = this.comisionDetalle.comision.fechaInicio;
    const horaSalida = this.comisionDetalle.comision.horaSalida || '00:00';
    if (!fi) return false;
    const fechaStr = fi.substring(0, 10);
    const fechaSalida = new Date(`${fechaStr}T${horaSalida}:00`);
    return fechaSalida < new Date();
  }

  // ─── Colores e iconos de estado ───

  colorEstado(idEstado?: number): string {
    switch (idEstado) {
      case 1:
        return 'bg-warning text-dark';
      case 2:
        return 'bg-info text-dark';
      case 3:
        return 'bg-primary';
      case 181:
        return 'bg-success';
      case 4:
        return 'bg-success';
      case 5:
        return 'bg-secondary';
      case 21:
        return 'bg-warning text-dark';
      case 41:
        return 'bg-success';
      case 61:
        return 'bg-success';
      case 81:
        return 'bg-danger';
      case 101:
        return 'bg-warning text-dark';
      case 121:
        return 'bg-danger';
      case 141:
        return 'bg-danger';
      case 161:
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  iconoEstado(idEstado?: number): string {
    switch (idEstado) {
      case 1:
        return 'bi-file-earmark-plus';
      case 2:
        return 'bi-pen';
      case 3:
        return 'bi-pen-fill';
      case 181:
        return 'bi-patch-check-fill';
      case 4:
        return 'bi-truck';
      case 5:
        return 'bi-flag-fill';
      case 21:
        return 'bi-fuel-pump';
      case 41:
        return 'bi-check2-circle';
      case 61:
        return 'bi-box-seam';
      case 81:
        return 'bi-x-circle';
      case 121:
        return 'bi-exclamation-triangle-fill';
      case 141:
        return 'bi-x-octagon';
      case 161:
        return 'bi-slash-circle';
      default:
        return 'bi-circle';
    }
  }

  // Define qué estados se pueden seleccionar desde el estado actual
  estadosAccionables(idEstado?: number): EstadoComision[] {
    switch (idEstado) {
      case 1:
        return this.estados.filter((e) => [2, 81].includes(e.id));
      case 2:
        return this.estados.filter((e) => [3, 81].includes(e.id));
      case 3:
        return this.estados.filter((e) => [81].includes(e.id));
      case 181:
        return this.estados.filter((e) => [81].includes(e.id));
      case 4:
        return this.estados.filter((e) => [5].includes(e.id));
      default:
        return [];
    }
  }

  // Abre el formulario de finalización
  abrirFinalizar(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarChecklist = false;
    this.mostrarFinalizar = true;
    this.formularioFinalizar.reset();
    this.limpiarMensajes();
  }

  // Finaliza la comisión
  finalizar(): void {
    if (this.formularioFinalizar.invalid) {
      this.formularioFinalizar.markAllAsTouched();
      return;
    }

    if (!confirm('¿Confirma finalizar esta comisión?')) return;

    const v = this.formularioFinalizar.value;
    const dto = {
      kilometrajeFinal: Number(v.kilometrajeFinal),
      fechaRetorno: v.fechaRetorno,
      horaRetorno: v.horaRetorno,
      observaciones: v.observaciones,
    };

    // Primero procesar devoluciones de cupones si hay seleccionados
    const devoluciones = this.solicitudCombustibleDetalle
      .map((d) => ({
        idDetalle: d.id,
        devueltos: (d._cupones || []).filter((c: any) => c.seleccionado).length,
      }))
      .filter((d) => d.devueltos > 0);

    if (devoluciones.length > 0) {
      // Procesar devoluciones en secuencia antes de finalizar
      this._procesarDevolucionesYFinalizar(devoluciones, 0, dto);
    } else {
      // Sin devoluciones — finalizar directamente
      this._ejecutarFinalizacion(dto);
    }
  }

  /** Procesa devoluciones de cupones en secuencia y luego finaliza */
  private _procesarDevolucionesYFinalizar(
    devoluciones: { idDetalle: number; devueltos: number }[],
    index: number,
    dto: any,
  ): void {
    if (index >= devoluciones.length) {
      this._ejecutarFinalizacion(dto);
      return;
    }

    const d = devoluciones[index];
    this.http
      .patch<any>(
        `${environment.apiUrl}/api/solicitud-combustible/${this.idSolicitudCombustible}/devolver`,
        { idDetalle: d.idDetalle, devueltos: d.devueltos },
      )
      .subscribe({
        next: () => this._procesarDevolucionesYFinalizar(devoluciones, index + 1, dto),
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar devolución.';
        },
      });
  }

  /** Ejecuta la finalización de la comisión */
  private _ejecutarFinalizacion(dto: any): void {
    this.comisionService.finalizarComision(this.comisionDetalle!.comision.id, dto).subscribe({
      next: () => {
        alert('Comisión finalizada correctamente.');
        this.mostrarFinalizar = false;
        this.mostrarDetalle = true;
        this.verDetalle(this.comisionDetalle!.comision.id);
        this.cargarEstadisticas();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al finalizar.';
      },
    });
  }

  abrirDevolucionCupones(): void {
    console.log('Abriendo devolución...');
    this.cuponesComision.forEach((c) => (c.seleccionado = false));
    this.totalSeleccionados = 0;
    this.mostrarSeleccionCupones = true;
    this.limpiarMensajes();
    this.cdr.detectChanges();
  }

  onModalAceptar(evento: { texto?: string; numero?: number }): void {
    this.modalVisible = false;
    if (this.modalAccion) {
      this.modalAccion();
      this.modalAccion = null;
    }
    this.modalConNumero = false;
  }
  onModalCancelar(): void {
    this.modalVisible = false;
    this.modalConNumero = false;
    this.modalAccion = null;
  }

  private _ejecutarDevolucionCupones(ids: number[]): void {
    this.cuponService.devolverCuponesComision(this.comisionDetalle!.comision.id, ids).subscribe({
      next: () => {
        this.mostrarSeleccionCupones = false;
        this.cuponesSeleccionados = [];
        this.mensajeExito = `${ids.length} cupones devueltos correctamente.`;
        this.verDetalle(this.comisionDetalle!.comision.id);
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al devolver cupones.';
      },
    });
  }

  abrirReasignar(): void {
    this.mostrarReasignar = true;
    this.idVehiculoReasignar = 0;
    this.idPilotoReasignar = 0;
    this.cargarVehiculosYPilotosChecklist();
    this.limpiarMensajes();
  }

  reasignarPilotoVehiculo(): void {
    if (!this.idVehiculoReasignar || !this.idPilotoReasignar) {
      this.mensajeError = 'Debe seleccionar un vehículo y un piloto.';
      return;
    }
    this.modalTitulo = 'Confirmar Reasignación';
    this.modalMensaje = '¿Confirma cambiar el piloto y/o vehículo de esta comisión?';
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Confirmar';
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarReasignacion();
  }

  private _ejecutarReasignacion(): void {
    this.comisionService
      .reasignarPilotoVehiculo(
        this.comisionDetalle!.comision.id,
        this.idVehiculoReasignar,
        this.idPilotoReasignar,
      )
      .subscribe({
        next: () => {
          this.mostrarReasignar = false;
          this.verDetalle(this.comisionDetalle!.comision.id);
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al reasignar.';
        },
      });
  }

  toggleCupon(cupon: any): void {
    this.ngZone.run(() => {
      cupon.seleccionado = !cupon.seleccionado;
      this.totalSeleccionados = this.cuponesComision.filter((c) => c.seleccionado).length;
    });
  }

  confirmarDevolucion(): void {
    const seleccionados = this.cuponesComision.filter((c) => c.seleccionado).map((c) => c.id);
    if (seleccionados.length === 0) {
      this.mensajeError = 'Seleccione al menos un cupón a devolver.';
      return;
    }
    this.modalTitulo = 'Confirmar Devolución';
    this.modalMensaje = `¿Confirma devolver <strong>${seleccionados.length}</strong> cupones seleccionados?`;
    this.modalTipo = 'devolucion';
    this.modalBtnAceptar = 'Confirmar Devolución';
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarDevolucionCupones(seleccionados);
  }
  /** Carga cupones disponibles para el checklist */
  cargarCuponesChecklist(): void {
    this.cuponService
      .obtenerTalonariosDisponibles(this.idSedeDelegado ?? undefined)
      .subscribe({ next: (data: any) => (this.cuponesDisponiblesChecklist = data) });
  }

  /** Selecciona rango de cupones en checklist */
  seleccionarRangoChecklist(id: any): void {
    this.rangoChecklistSeleccionado =
      this.cuponesDisponiblesChecklist.find((r: any) => r.id == id) || null;
    this.cantidadChecklistAsignar = 0;
  }

  /** Agrega cupones al listado del checklist */
  /** Agrega cupones al listado del checklist con validación de disponibilidad */
  agregarCuponChecklist(): void {
    if (!this.rangoChecklistSeleccionado || this.cantidadChecklistAsignar <= 0) {
      this.mensajeError = 'Seleccione un rango e ingrese una cantidad válida.';
      return;
    }

    // Validar que no supere la disponibilidad
    const disponibles = this.rangoChecklistSeleccionado.disponibles;
    if (this.cantidadChecklistAsignar > disponibles) {
      this.mensajeError = `No hay suficientes cupones. Solo hay ${disponibles} disponibles en este rango.`;
      return;
    }

    this.cuponesChecklistAgregados.push({
      rango: { ...this.rangoChecklistSeleccionado },
      cantidad: this.cantidadChecklistAsignar,
    });
    this.rangoChecklistSeleccionado = null;
    this.cantidadChecklistAsignar = 0;
    this.mensajeError = '';
  }

  /** Elimina cupón del listado del checklist */
  eliminarCuponChecklist(index: number): void {
    this.cuponesChecklistAgregados.splice(index, 1);
  }

  get totalCuponesChecklist(): number {
    return this.cuponesChecklistAgregados.reduce((a: number, c: any) => a + c.cantidad, 0);
  }

  get montoTotalChecklist(): number {
    return this.cuponesChecklistAgregados.reduce(
      (a: number, c: any) => a + c.cantidad * (c.rango.denominacion || 0),
      0,
    );
  }

  /** Carga el PDF de combustible vinculado a la comisión */
  cargarPdfCombustible(idComision: number): void {
    this.http
      .get<any>(
        `${environment.apiUrl}/api/solicitud-combustible?idComision=${idComision}&porPagina=100`,
      )
      .subscribe({
        next: (data: any) => {
          if (data.datos && data.datos.length > 0) {
            this.urlPdfCombustible = data.datos[0].urlPdf || '';
            this.tieneCuponesAsignados = true;
            this.cargarDetalleCombustible(data.datos[0].id);
            this.cdr.detectChanges();
          } else {
            // No hay solicitud de combustible para esta comisión
            this.urlPdfCombustible = '';
            this.tieneCuponesAsignados = false;
          }
        },
      });
  }
  /** Abre el PDF de combustible */
  verPdf(urlPdf: string): void {
    this.authService.abrirPdf(urlPdf);
  }
  /** Carga detalle de cupones de la solicitud de combustible */
  cargarDetalleCombustible(idSolicitud: number): void {
    this.idSolicitudCombustible = idSolicitud;
    this.http
      .get<any[]>(`${environment.apiUrl}/api/solicitud-combustible/${idSolicitud}/detalle`)
      .subscribe({
        next: (data) => {
          this.solicitudCombustibleDetalle = data;
          this.cdr.detectChanges();
        },
      });
  }

  /** Abre modal para devolver cupones de combustible */
  /** Abre modal con cupones individuales del rango para devolución */
  abrirDevolucionCombustible(det: any): void {
    this.detalleDevolucionComb = det;
    this.mostrarModalDevolucionComb = true;

    // Generar solo los cupones entregados (cantidad), desde numeroDel
    this.cuponesIndividualesDevolucion = [];
    for (let i = det.numeroDel; i < det.numeroDel + det.cantidad; i++) {
      this.cuponesIndividualesDevolucion.push({
        numero: i,
        seleccionado: false,
      });
    }
  }

  /** Marca/desmarca un cupón individual */
  toggleCuponDevolucion(cupon: { numero: number; seleccionado: boolean }): void {
    cupon.seleccionado = !cupon.seleccionado;
    this.cdr.detectChanges();
  }

  get totalCuponesDevolucion(): number {
    return this.cuponesIndividualesDevolucion.filter((c) => c.seleccionado).length;
  }

  /** Confirma devolución de cupones de combustible */
  /** Confirma devolución con cupones individuales seleccionados */
  confirmarDevolucionCombustible(): void {
    const seleccionados = this.cuponesIndividualesDevolucion.filter((c) => c.seleccionado).length;

    if (seleccionados === 0) {
      this.mensajeError = 'Seleccione al menos un cupón.';
      return;
    }

    this.mostrarModalDevolucionComb = false;

    this.http
      .patch<any>(
        `${environment.apiUrl}/api/solicitud-combustible/${this.idSolicitudCombustible}/devolver`,
        { idDetalle: this.detalleDevolucionComb.id, devueltos: seleccionados },
      )
      .subscribe({
        next: () => {
          this.mensajeExito = `${seleccionados} cupones devueltos correctamente.`;
          this.cargarDetalleCombustible(this.idSolicitudCombustible);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al devolver cupones.';
        },
      });
  }

  /** Genera lista de cupones individuales para un rango — usado en finalización */
  generarCuponesIndividuales(det: any): { numero: number; seleccionado: boolean }[] {
    if (!det._cupones) {
      det._cupones = [];
      for (let i = det.numeroDel; i < det.numeroDel + det.cantidad; i++) {
        det._cupones.push({ numero: i, seleccionado: false });
      }
    }
    return det._cupones;
  }

  /** Marca/desmarca cupón en pantalla de finalización */
  toggleCuponFinalizacion(cupon: { numero: number; seleccionado: boolean }): void {
    cupon.seleccionado = !cupon.seleccionado;
    this.cdr.detectChanges();
  }
  /** Carga el kilometraje actual del vehículo seleccionado */
  onVehiculoSeleccionado(idVehiculo: any): void {
    const vehiculo = this.vehiculos.find((v: any) => v.id == Number(idVehiculo));
    console.log('Vehículo:', vehiculo);
    this.kmInicialVehiculo = vehiculo ? vehiculo.kilometraje || 0 : 0;
    this.cdr.detectChanges();
  }
  verPdfCombustible(): void {
    this.authService.abrirPdf(this.urlPdfCombustible);
  }
}
