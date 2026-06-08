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
  ) {
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
    // Formulario checklist / asignación vehículo
    this.formularioChecklist = this.fb.group({
      idVehiculo: ['', Validators.required],
      idPiloto: ['', Validators.required],
      fechaRevision: ['', Validators.required],
      horaRevision: ['', Validators.required],
      kilometrajInicial: ['', Validators.required],
      montoCombustible: ['', [Validators.required, Validators.min(50)]],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    this.esDelegado = this.authService.tieneRol('delegado');
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
    this.comisionService
      .obtenerVehiculosDisponibles(fi, ff)
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
    this.comisionService
      .obtenerVehiculosDisponibles(fi, ff)
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

    // Validar que el monto sea múltiplo de Q50
    const monto = Number(this.formularioChecklist.get('montoCombustible')?.value);
    if (monto % 50 !== 0) {
      this.mensajeError = 'El monto de combustible debe ser múltiplo de Q50.00';
      return;
    }

    if (!confirm('¿Confirma asignar vehículo y piloto? La comisión pasará a En Curso.')) return;

    const v = this.formularioChecklist.value;
    const dto: ChecklistComision = {
      idVehiculo: Number(v.idVehiculo),
      idPiloto: Number(v.idPiloto),
      fechaRevision: v.fechaRevision,
      horaRevision: v.horaRevision,
      kilometrajInicial: Number(v.kilometrajInicial),
      montoCombustible: Number(v.montoCombustible),
      observaciones: v.observaciones,
    };

    this.comisionService.registrarChecklist(this.comisionDetalle!.comision.id, dto).subscribe({
      next: () => {
        this.mensajeExito = 'Vehículo y piloto asignados. Comisión en curso.';
        this.verDetalle(this.comisionDetalle!.comision.id);
        this.cargarEstadisticas();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar.';
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

    const v = this.formularioFinalizar.value;
    const dto = {
      kilometrajeFinal: Number(v.kilometrajeFinal),
      fechaRetorno: v.fechaRetorno,
      horaRetorno: v.horaRetorno,
      observaciones: v.observaciones,
    };

    if (!confirm('¿Confirma finalizar esta comisión?')) return;

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
}
