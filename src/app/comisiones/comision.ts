import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComisionService } from '../servicios/comision.service';
import {
  Comision, ComisionRequest, ComisionDetalle,
  EstadoComision, EstadisticaComision, ComisionPersona, HistorialComision
} from '../modelos/comision.model';
import { CatalogoItem } from '../modelos/vehiculo.model';

@Component({
  selector: 'app-comision',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './comision.html'
})
export class ComisionComponent implements OnInit {

  // Lista
  comisiones:     Comision[] = [];
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;

  // Filtros
  filtroEstado:      number = 0;
  filtroTipo:        string = '';
  filtroSolicitante: string = '';
  filtroDestino:     string = '';

  // Catálogos
  estados:   EstadoComision[]     = [];
  unidades:  CatalogoItem[]       = [];
  vehiculos: CatalogoItem[]       = [];
  pilotos:   CatalogoItem[]       = [];

  // Estadísticas
  estadisticas: EstadisticaComision[] = [];

  // Tipos
  tipos = ['Local', 'Nacional', 'Regional'];

  // Control de vistas
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;

  // Comisión seleccionada
  comisionDetalle: ComisionDetalle | null = null;
  personas:        ComisionPersona[]      = [];
  historial:       HistorialComision[]    = [];

  // Personas en formulario
  personasFormulario: string[] = [''];

  // Nueva persona en detalle
  nuevaPersona: string = '';

  // Formularios
  formulario: FormGroup;

  // Mensajes
  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;

  // Modal estado
  mostrarModalEstado:  boolean = false;
  nuevoEstado:         number  = 0;
  justificacionEstado: string  = '';

  constructor(
    private comisionService: ComisionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      tipoComision:        ['', Validators.required],
      solicitante:         ['', Validators.required],
      idUnidad:            ['', Validators.required],
      departamentoSeccion: [''],
      fechaInicio:         ['', Validators.required],
      fechaFin:            ['', Validators.required],
      horaSalida:          ['', Validators.required],
      duracionAproximada:  [''],
      destino:             ['', Validators.required],
      motivo:              ['', Validators.required],
      observaciones:       [''],
      autoridad1Nombre:    [''],
      autoridad1Cargo:     [''],
      autoridad2Nombre:    [''],
      autoridad2Cargo:     [''],
      autoridad3Nombre:    [''],
      autoridad3Cargo:     [''],
    });
  }

  ngOnInit(): void {
    this.cargarComisiones();
    this.cargarEstados();
    this.cargarUnidades();
    this.cargarEstadisticas();
  }

  cargarComisiones(): void {
    this.cargando = true;
    this.comisionService.obtenerComisiones(
      this.paginaActual, this.tamanioPagina,
      this.filtroEstado || undefined,
      this.filtroTipo || undefined,
      this.filtroSolicitante || undefined,
      this.filtroDestino || undefined
    ).subscribe({
      next: (data) => {
        this.comisiones     = [...data.comisiones];
        this.totalRegistros = data.totalRegistros;
        this.totalPaginas   = data.totalPaginas;
        this.cargando       = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar comisiones.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarEstados(): void {
    this.comisionService.obtenerEstados()
      .subscribe({ next: (data) => this.estados = data });
  }

  cargarUnidades(): void {
    this.comisionService.obtenerUnidades()
      .subscribe({ next: (data) => this.unidades = data });
  }

  cargarEstadisticas(): void {
    this.comisionService.obtenerEstadisticas()
      .subscribe({ next: (data) => this.estadisticas = data });
  }

  cargarVehiculosYPilotos(): void {
    const fi = this.formulario.get('fechaInicio')?.value;
    const ff = this.formulario.get('fechaFin')?.value;
    if (!fi || !ff) return;

    this.comisionService.obtenerVehiculosDisponibles(fi, ff)
      .subscribe({ next: (data) => this.vehiculos = data });
    this.comisionService.obtenerPilotosDisponibles(fi, ff)
      .subscribe({ next: (data) => this.pilotos = data });
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarComisiones();
  }

  limpiarFiltros(): void {
    this.filtroEstado      = 0;
    this.filtroTipo        = '';
    this.filtroSolicitante = '';
    this.filtroDestino     = '';
    this.filtrar();
  }

  abrirFormulario(): void {
    this.mostrarLista       = false;
    this.mostrarFormulario  = true;
    this.mostrarDetalle     = false;
    this.personasFormulario = [''];
    this.formulario.reset();
    this.limpiarMensajes();
  }

  verDetalle(id: number): void {
    this.comisionService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.comisionDetalle   = data;
        this.personas          = data.personas;
        this.historial         = data.historial;
        this.mostrarLista      = false;
        this.mostrarFormulario = false;
        this.mostrarDetalle    = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el detalle.';
      }
    });
  }

  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.comisionDetalle   = null;
    this.limpiarMensajes();
  }

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
    this.comisionService.agregarPersona(
      this.comisionDetalle!.comision.id,
      { nombrePersona: this.nuevaPersona }
    ).subscribe({
      next: () => {
        this.nuevaPersona = '';
        this.verDetalle(this.comisionDetalle!.comision.id);
      },
      error: () => { this.mensajeError = 'Error al agregar persona.'; }
    });
  }

  eliminarPersona(id: number): void {
    if (!confirm('¿Eliminar esta persona?')) return;
    this.comisionService.eliminarPersona(id).subscribe({
      next: () => this.verDetalle(this.comisionDetalle!.comision.id),
      error: () => { this.mensajeError = 'Error al eliminar persona.'; }
    });
  }

  abrirModalEstado(idEstado: number): void {
    this.nuevoEstado         = idEstado;
    this.justificacionEstado = '';
    this.mostrarModalEstado  = true;
  }

  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
  }

  confirmarCambioEstado(): void {
    if (!this.comisionDetalle) return;
    this.comisionService.cambiarEstado(
      this.comisionDetalle.comision.id,
      { idEstado: this.nuevoEstado, justificacion: this.justificacionEstado }
    ).subscribe({
      next: () => {
        this.mostrarModalEstado = false;
        this.verDetalle(this.comisionDetalle!.comision.id);
        this.cargarEstadisticas();
      },
      error: () => { this.mensajeError = 'Error al cambiar el estado.'; }
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.value;

    // Validar hora de salida si la fecha es hoy
    if (v.horaSalida && v.fechaInicio) {
      const hoy        = new Date();
      const fechaForm  = new Date(v.fechaInicio + 'T00:00:00');
      const esHoy      = hoy.toDateString() === fechaForm.toDateString();

      if (esHoy) {
        const [horas, minutos] = v.horaSalida.split(':').map(Number);
        const horaSalidaDate   = new Date();
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
      tipoComision:        v.tipoComision,
      solicitante:         v.solicitante,
      idUnidad:            Number(v.idUnidad),
      departamentoSeccion: v.departamentoSeccion,
      fechaInicio:         v.fechaInicio,
      fechaFin:            v.fechaFin,
      horaSalida:          v.horaSalida,
      duracionAproximada:  v.duracionAproximada,
      destino:             v.destino,
      motivo:              v.motivo,
      observaciones:       v.observaciones,
      autoridad1Nombre:    v.autoridad1Nombre,
      autoridad1Cargo:     v.autoridad1Cargo,
      autoridad2Nombre:    v.autoridad2Nombre,
      autoridad2Cargo:     v.autoridad2Cargo,
      autoridad3Nombre:    v.autoridad3Nombre,
      autoridad3Cargo:     v.autoridad3Cargo,
      personas:            this.personasFormulario.filter(p => p.trim() !== '')
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
        this.cargando     = false;
      }
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarComisiones();
  }

  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  esFechaVencida(fecha?: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }

  colorEstado(idEstado?: number): string {
    switch (idEstado) {
      case 1:   return 'bg-warning text-dark';
    case 2:   return 'bg-info text-dark';
    case 3:   return 'bg-primary';
    case 181: return 'bg-success';      // Autorizada
    case 4:   return 'bg-success';
    case 5:   return 'bg-secondary';
    case 21:  return 'bg-warning text-dark';
    case 41:  return 'bg-success';
    case 61:  return 'bg-success';
    case 81:  return 'bg-danger';
    case 101: return 'bg-warning text-dark';
    case 121: return 'bg-danger';
    case 141: return 'bg-danger';
    case 161: return 'bg-secondary';
    default:  return 'bg-secondary';
    }
  }

  iconoEstado(idEstado?: number): string {
    switch (idEstado) {
      case 1:   return 'bi-file-earmark-plus';
    case 2:   return 'bi-pen';
    case 3:   return 'bi-pen-fill';
    case 181: return 'bi-patch-check-fill';
    case 4:   return 'bi-truck';
    case 5:   return 'bi-flag-fill';
    case 21:  return 'bi-fuel-pump';
    case 41:  return 'bi-check2-circle';
    case 61:  return 'bi-box-seam';
    case 81:  return 'bi-x-circle';
    case 101: return 'bi-exclamation-triangle';
    case 121: return 'bi-exclamation-triangle-fill';
    case 141: return 'bi-x-octagon';
    case 161: return 'bi-slash-circle';
    default:  return 'bi-circle';
    }
  }

  estadosAccionables(idEstado?: number): EstadoComision[] {
    switch (idEstado) {
   case 1:   return this.estados.filter(e => [2, 81].includes(e.id));
    case 2:   return this.estados.filter(e => [3, 81].includes(e.id));
    case 3:   return this.estados.filter(e => [81].includes(e.id));
    case 181: return this.estados.filter(e => [4, 81].includes(e.id));
    case 4:   return this.estados.filter(e => [5].includes(e.id));
    default:  return [];
    }
  }

  registrarFirma(autoridad: number): void {
  if (!this.comisionDetalle) return;
  if (!confirm(`¿Confirma registrar la firma de la Autoridad ${autoridad}?`)) return;

  this.comisionService.registrarFirma(
    this.comisionDetalle.comision.id, autoridad
  ).subscribe({
    next: () => {
      this.verDetalle(this.comisionDetalle!.comision.id);
      this.cargarEstadisticas();
    },
    error: () => { this.mensajeError = 'Error al registrar la firma.'; }
  });
}
}