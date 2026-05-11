import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuponService } from '../../servicios/cupon.service';
import { SolicitudTalonario, SolicitudTalonarioRequest, AprobarSolicitudTalonario, RechazarSolicitudTalonario } from '../../modelos/cupon.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';

@Component({
  selector: 'app-solicitud-talonario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './solicitud-talonario.html'
})
export class SolicitudTalonarioComponent implements OnInit {

  solicitudes:    SolicitudTalonario[] = [];
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;
  filtroEstado:   string = '';
  sedes:          CatalogoItem[] = [];
  talonariosDisponibles: CatalogoItem[] = [];

  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;
  mostrarAprobar:    boolean = false;
  mostrarRechazar:   boolean = false;

  solicitudSeleccionada: SolicitudTalonario | null = null;

  estados = [
    { id: '',           nombre: 'Todos'     },
    { id: 'Pendiente',  nombre: 'Pendiente' },
    { id: 'Aprobada',   nombre: 'Aprobada'  },
    { id: 'Rechazada',  nombre: 'Rechazada' },
  ];

  valores = [50, 100];

  formulario:        FormGroup;
  formularioAprobar: FormGroup;
  formularioRechazar: FormGroup;

  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;

  constructor(
    private cuponService: CuponService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      idSede:          ['', Validators.required],
      cantidadCupones: ['', [Validators.required, Validators.min(1)]],
      valorCupon:      [100, Validators.required],
      motivo:          ['', Validators.required],
    });

    this.formularioAprobar = this.fb.group({
      idTalonario:      ['', Validators.required],
      nombreEntregador: ['', Validators.required],
      nombreReceptor:   ['', Validators.required],
    });

    this.formularioRechazar = this.fb.group({
      justificacionRechazo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarSedes();
    this.cargarTalonariosDisponibles();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.cuponService.obtenerSolicitudesTalonario(
      this.paginaActual,
      this.tamanioPagina,
      this.filtroEstado || undefined
    ).subscribe({
      next: (data) => {
        this.solicitudes    = [...data.solicitudes];
        this.totalRegistros = data.totalRegistros;
        this.totalPaginas   = data.totalPaginas;
        this.cargando       = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar solicitudes.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarSedes(): void {
    this.cuponService.obtenerSedes()
      .subscribe({ next: (data) => this.sedes = data });
  }

  cargarTalonariosDisponibles(): void {
    this.cuponService.obtenerTalonariosDisponibles()
      .subscribe({ next: (data) => this.talonariosDisponibles = data });
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  abrirFormulario(): void {
    this.mostrarLista      = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle    = false;
    this.mostrarAprobar    = false;
    this.mostrarRechazar   = false;
    this.formulario.reset({ valorCupon: 100 });
    this.limpiarMensajes();
  }

  verDetalle(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = true;
    this.mostrarAprobar        = false;
    this.mostrarRechazar       = false;
  }

  abrirAprobar(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = false;
    this.mostrarAprobar        = true;
    this.mostrarRechazar       = false;
    this.formularioAprobar.reset();
    this.limpiarMensajes();
  }

  abrirRechazar(s: SolicitudTalonario): void {
    this.solicitudSeleccionada = s;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = false;
    this.mostrarAprobar        = false;
    this.mostrarRechazar       = true;
    this.formularioRechazar.reset();
    this.limpiarMensajes();
  }

  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.mostrarAprobar    = false;
    this.mostrarRechazar   = false;
    this.limpiarMensajes();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (!confirm('¿Está seguro que desea enviar esta solicitud?')) return;

    this.cargando = true;
    const v = this.formulario.value;

    const dto: SolicitudTalonarioRequest = {
      idSede:          Number(v.idSede),
      cantidadCupones: Number(v.cantidadCupones),
      valorCupon:      Number(v.valorCupon),
      motivo:          v.motivo,
    };

    this.cuponService.agregarSolicitudTalonario(dto).subscribe({
      next: () => {
        this.cargando = false;
        alert('Solicitud enviada correctamente.');
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al enviar la solicitud.';
        this.cargando     = false;
      }
    });
  }

  guardarAprobacion(): void {
    if (this.formularioAprobar.invalid) {
      this.formularioAprobar.markAllAsTouched();
      return;
    }
    if (!confirm('¿Está seguro que desea aprobar esta solicitud?')) return;

    const v = this.formularioAprobar.value;
    const dto: AprobarSolicitudTalonario = {
      idTalonario:      Number(v.idTalonario),
      nombreEntregador: v.nombreEntregador,
      nombreReceptor:   v.nombreReceptor,
    };

    this.cuponService.aprobarSolicitudTalonario(this.solicitudSeleccionada!.id, dto).subscribe({
      next: () => {
        alert('Solicitud aprobada y talonario asignado correctamente.');
        this.volverLista();
        this.cargarSolicitudes();
        this.cargarTalonariosDisponibles();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al aprobar la solicitud.';
      }
    });
  }

  guardarRechazo(): void {
    if (this.formularioRechazar.invalid) {
      this.formularioRechazar.markAllAsTouched();
      return;
    }
    if (!confirm('¿Está seguro que desea rechazar esta solicitud?')) return;

    const v = this.formularioRechazar.value;
    const dto: RechazarSolicitudTalonario = {
      justificacionRechazo: v.justificacionRechazo,
    };

    this.cuponService.rechazarSolicitudTalonario(this.solicitudSeleccionada!.id, dto).subscribe({
      next: () => {
        alert('Solicitud rechazada correctamente.');
        this.volverLista();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al rechazar la solicitud.';
      }
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarSolicitudes();
  }

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

  colorEstado(estado?: string): string {
    switch (estado) {
      case 'Pendiente':  return 'bg-warning text-dark';
      case 'Aprobada':   return 'bg-success';
      case 'Rechazada':  return 'bg-danger';
      default:           return 'bg-secondary';
    }
  }
}