import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MantenimientoService } from '../../servicios/mantenimiento.service';
import {
  Mantenimiento,
  MantenimientoRequest,
  MantenimientoActualizar,
  CambiarEstadoMantenimiento,
} from '../../modelos/mantenimiento.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mantenimiento.html',
})
export class MantenimientoComponent implements OnInit {
  // Lista de mantenimientos
  mantenimientos: Mantenimiento[] = [];

  // Vehículos para el filtro y formulario
  vehiculos: CatalogoItem[] = [];

  // Paginación
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalRegistros: number = 0;
  totalPaginas: number = 0;
  costoRealEstado: number = 0;

  // Filtros
  textoBusqueda: string = '';
  filtroVehiculo: number = 0;
  filtroEstado: string = '';
  private busquedaSubject = new Subject<string>();

  // Tipos de mantenimiento
  tiposMantenimiento = ['Preventivo', 'Correctivo', 'Predictivo'];

  // Estados de mantenimiento
  estados = ['Programado', 'En Proceso', 'Completado', 'Cancelado'];

  // Control de vistas
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;
  modoEdicion: boolean = false;

  // Mantenimiento seleccionado
  mantenimientoSeleccionado: Mantenimiento | null = null;

  // Modal cambiar estado
  mostrarModalEstado: boolean = false;
  nuevoEstado: string = '';
  fechaRealizadoEstado: string = '';

  // Formulario
  formulario: FormGroup;

  // Mensajes
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(
    private mantenimientoService: MantenimientoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.formulario = this.fb.group({
      idVehiculo: ['', Validators.required],
      tipoMantenimiento: ['', Validators.required],
      fechaProgramada: ['', Validators.required],
      fechaRealizado: [''],
      descripcion: ['', Validators.required],
      observaciones: [''],
      // costoReal:         [0],
      estado: ['Programado'],
    });

    this.busquedaSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.paginaActual = 1;
      this.cargarMantenimientos();
    });
  }

  ngOnInit(): void {
    this.cargarMantenimientos();
    this.cargarVehiculos();
  }

  // Carga la lista de mantenimientos
  cargarMantenimientos(): void {
    this.cargando = true;
    this.mantenimientoService
      .obtener(
        this.paginaActual,
        this.tamanioPagina,
        this.textoBusqueda,
        this.filtroVehiculo || undefined,
        this.filtroEstado || undefined,
      )
      .subscribe({
        next: (data) => {
          this.mantenimientos = [...data.mantenimientos];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas = data.totalPaginas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar mantenimientos.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Carga vehículos para el formulario
  cargarVehiculos(): void {
    this.mantenimientoService.obtenerVehiculos().subscribe({
      next: (data) => (this.vehiculos = data),
      error: () => console.error('Error al cargar vehículos'),
    });
  }

  // Búsqueda en tiempo real
  buscarEnTiempoReal(): void {
    this.busquedaSubject.next(this.textoBusqueda);
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarMantenimientos();
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.filtroVehiculo = 0;
    this.filtroEstado = '';
    this.paginaActual = 1;
    this.cargarMantenimientos();
  }

  // Muestra formulario para agregar
  mostrarAgregar(): void {
    this.modoEdicion = false;
    this.mostrarLista = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
    this.formulario.reset({ costoReal: 0, estado: 'Programado' });
    this.limpiarMensajes();
  }

  // Muestra formulario para editar
  mostrarEditar(mantenimiento: Mantenimiento): void {
    this.modoEdicion = true;
    this.mantenimientoSeleccionado = mantenimiento;
    this.mostrarLista = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
    this.limpiarMensajes();

    this.formulario.patchValue({
      idVehiculo: Number(mantenimiento.idVehiculo),
      tipoMantenimiento: mantenimiento.tipoMantenimiento,
      fechaProgramada: mantenimiento.fechaProgramada
        ? mantenimiento.fechaProgramada.substring(0, 10)
        : '',
      fechaRealizado: mantenimiento.fechaRealizado
        ? mantenimiento.fechaRealizado.substring(0, 10)
        : '',
      descripcion: mantenimiento.descripcion,
      observaciones: mantenimiento.observaciones,
      costoReal: mantenimiento.costoReal,
      estado: mantenimiento.estado,
    });
  }

  // Muestra detalle
  verDetalle(mantenimiento: Mantenimiento): void {
    this.mantenimientoSeleccionado = mantenimiento;
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = true;
  }

  // Vuelve a la lista
  volverLista(): void {
    this.mostrarLista = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.limpiarMensajes();
  }

  // Guarda el mantenimiento
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (
      !confirm(
        this.modoEdicion
          ? '¿Está seguro que desea actualizar este mantenimiento?'
          : '¿Está seguro que desea registrar este mantenimiento?',
      )
    )
      return;

    this.cargando = true;
    const valores = this.formulario.value;

    if (this.modoEdicion && this.mantenimientoSeleccionado) {
      const datos: MantenimientoActualizar = {
        tipoMantenimiento: valores.tipoMantenimiento,
        fechaProgramada: valores.fechaProgramada || undefined,
        fechaRealizado: valores.fechaRealizado || undefined,
        descripcion: valores.descripcion,
        observaciones: valores.observaciones || undefined,
        costoReal: valores.costoReal,
        estado: valores.estado,
      };

      this.mantenimientoService.actualizar(this.mantenimientoSeleccionado.id, datos).subscribe({
        next: () => {
          this.cargando = false;
          alert('Mantenimiento actualizado correctamente.');
          this.volverLista();
          this.cargarMantenimientos();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al actualizar.';
          this.cargando = false;
        },
      });
    } else {
      const datos: MantenimientoRequest = {
        idVehiculo: valores.idVehiculo,
        tipoMantenimiento: valores.tipoMantenimiento,
        fechaProgramada: valores.fechaProgramada || undefined,
        descripcion: valores.descripcion,
        observaciones: valores.observaciones || undefined,
        fuente: 'Manual',
        costoReal: valores.costoReal,
      };

      this.mantenimientoService.agregar(datos).subscribe({
        next: () => {
          this.cargando = false;
          alert('Mantenimiento registrado correctamente.');
          this.volverLista();
          this.cargarMantenimientos();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar.';
          this.cargando = false;
        },
      });
    }
  }

  // Cancela un mantenimiento
  cancelar(id: number): void {
    if (!confirm('¿Está seguro que desea cancelar este mantenimiento?')) return;

    this.mantenimientoService.borrar(id).subscribe({
      next: () => {
        alert('Mantenimiento cancelado correctamente.');
        this.cargarMantenimientos();
      },
      error: (err) => {
        alert(err.error?.mensaje || 'Error al cancelar.');
      },
    });
  }

  // Abre modal de cambiar estado
  abrirCambiarEstado(mantenimiento: Mantenimiento): void {
    this.mantenimientoSeleccionado = mantenimiento;
    this.nuevoEstado = mantenimiento.estado || 'Programado';
    this.fechaRealizadoEstado = '';
    this.costoRealEstado = 0;
    this.mostrarModalEstado = true;
  }

  // Cierra modal de cambiar estado
  cerrarModalEstado(): void {
    this.mostrarModalEstado = false;
  }

  // Guarda el cambio de estado
  guardarEstado(): void {
    if (!this.mantenimientoSeleccionado) return;

    const dto: CambiarEstadoMantenimiento = {
      estado: this.nuevoEstado,
      fechaRealizado: this.fechaRealizadoEstado || undefined,
      costoReal: this.nuevoEstado === 'Completado' ? this.costoRealEstado : undefined,
    };

    this.mantenimientoService.cambiarEstado(this.mantenimientoSeleccionado.id, dto).subscribe({
      next: () => {
        alert('Estado actualizado correctamente.');
        this.cerrarModalEstado();
        this.cargarMantenimientos();
      },
      error: (err) => {
        alert(err.error?.mensaje || 'Error al cambiar estado.');
      },
    });
  }

  // Cambiar página
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarMantenimientos();
  }

  // Cambiar tamaño de página
  cambiarTamanioPagina(tamano: number): void {
    this.tamanioPagina = tamano;
    this.paginaActual = 1;
    this.cargarMantenimientos();
  }

  // Verifica si un campo tiene error
  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  // Limpia mensajes
  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Retorna arreglo de páginas
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  // Color del badge según estado
  colorEstado(estado?: string): string {
    switch (estado) {
      case 'Programado':
        return 'bg-primary';
      case 'En Proceso':
        return 'bg-warning text-dark';
      case 'Completado':
        return 'bg-success';
      case 'Cancelado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
