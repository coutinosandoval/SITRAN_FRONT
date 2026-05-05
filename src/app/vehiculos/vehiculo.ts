import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VehiculoService } from '../servicios/vehiculo.service';
import { Vehiculo, VehiculoRequest, VehiculoCatalogos } from '../modelos/vehiculo.model';

@Component({
  selector: 'app-vehiculo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vehiculo.html'

})
export class VehiculoComponent implements OnInit {

  // Lista de vehículos
  vehiculos: Vehiculo[] = [];

  // Catálogos para el formulario
  catalogos: VehiculoCatalogos = {
    tiposVehiculo:    [],
    tiposCombustible: [],
    tiposTransmision: [],
    sedes:            []
  };

  // Paginación
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;

  // Búsqueda
  textoBusqueda: string = '';
  private busquedaSubject = new Subject<string>();

  // Control de vistas
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;
  modoEdicion:       boolean = false;

  // Vehículo seleccionado
  vehiculoSeleccionado: Vehiculo | null = null;

  // Formulario reactivo
  formulario: FormGroup;

  // Mensajes
  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;
mostrarModalDisponibilidad:  boolean  = false;
vehiculoDisponibilidad:      Vehiculo | null = null;
estadoDisponibilidad:        string   = '';
observacionesDisponibilidad: string   = '';
estadosDisponibilidad = [
  'Disponible',
  'No Disponible',
  'En Comision',
  'En Mantenimiento'
];

  constructor(
    private vehiculoService: VehiculoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar formulario con validaciones
    this.formulario = this.fb.group({
      placa:             ['', [Validators.required, Validators.maxLength(15)]],
      numeroInventario:  ['', [Validators.required, Validators.maxLength(30)]],
      marca:             ['', [Validators.required, Validators.maxLength(50)]],
      modelo:            ['', [Validators.required, Validators.maxLength(50)]],
      anio:              ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
      color:             [''],
      idTipoVehiculo:    ['', Validators.required],
      idTipoCombustible: ['', Validators.required],
      idTipoTransmision: ['', Validators.required],
      numeroChasis:      [''],
      numeroVin:         [''],
      tamanioMotor:      [0],
      capacidadTanque:   [0],
      rendimientoGalon:  [0],
      kilometraje:       [0],
      idSede:            ['', Validators.required],
    });

    // Búsqueda en tiempo real con debounce de 400ms
    this.busquedaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 1;
      this.cargarVehiculos();
    });
  }

  ngOnInit(): void {
    this.cargarVehiculos();
    this.cargarCatalogos();
  }

  // Carga la lista de vehículos
  cargarVehiculos(): void {
    this.cargando = true;
    this.vehiculoService.obtener(this.paginaActual, this.tamanioPagina, this.textoBusqueda)
      .subscribe({
        next: (data) => {
          this.vehiculos      = [...data.vehiculos];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas   = data.totalPaginas;
          this.cargando       = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar vehículos.';
          this.cargando     = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Carga los catálogos para el formulario
  cargarCatalogos(): void {
    this.vehiculoService.obtenerCatalogos()
      .subscribe({
        next: (data) => this.catalogos = data,
        error: () => console.error('Error al cargar catálogos')
      });
  }

  // Búsqueda en tiempo real
  buscarEnTiempoReal(): void {
    this.busquedaSubject.next(this.textoBusqueda);
  }

  // Buscar vehículos
  buscar(): void {
    this.paginaActual = 1;
    this.cargarVehiculos();
  }

  // Limpiar búsqueda
  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.paginaActual  = 1;
    this.cargarVehiculos();
  }

  // Muestra el formulario para agregar
  mostrarAgregar(): void {
    this.modoEdicion       = false;
    this.mostrarLista      = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle    = false;
    this.formulario.reset();
    this.limpiarMensajes();
  }

  // Muestra el formulario para editar
  mostrarEditar(vehiculo: Vehiculo): void {
    console.log('Vehículo a editar:', JSON.stringify(vehiculo));  // ← AGREGAR
  this.modoEdicion          = true;
  this.vehiculoSeleccionado = vehiculo;
    this.modoEdicion          = true;
    this.vehiculoSeleccionado = vehiculo;
    this.mostrarLista         = false;
    this.mostrarFormulario    = true;
    this.mostrarDetalle       = false;
    this.limpiarMensajes();

    this.formulario.patchValue({
  placa:             vehiculo.placa,
  numeroInventario:  vehiculo.numeroInventario,
  marca:             vehiculo.marca,
  modelo:            vehiculo.modelo,
  anio:              vehiculo.anio,
  color:             vehiculo.color,
  idTipoVehiculo:    Number(vehiculo.idTipoVehiculo),
  idTipoCombustible: Number(vehiculo.idTipoCombustible),
  idTipoTransmision: Number(vehiculo.idTipoTransmision),
  numeroChasis:      vehiculo.numeroChasis,
  numeroVin:         vehiculo.numeroVin,
  tamanioMotor:      vehiculo.tamanioMotor,
  capacidadTanque:   vehiculo.capacidadTanque,
  rendimientoGalon:  vehiculo.rendimientoGalon,
  kilometraje:       vehiculo.kilometraje,
  idSede:            Number(vehiculo.idSede),
    });
  }

  // Muestra el detalle de un vehículo
  verDetalle(vehiculo: Vehiculo): void {
    this.vehiculoSeleccionado = vehiculo;
    this.mostrarLista         = false;
    this.mostrarFormulario    = false;
    this.mostrarDetalle       = true;
  }

  // Regresa a la lista
  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.limpiarMensajes();
  }

  // Guarda el vehículo (agregar o editar)
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!confirm(this.modoEdicion
      ? '¿Está seguro que desea actualizar este vehículo?'
      : '¿Está seguro que desea registrar este vehículo?'))
      return;

    this.cargando = true;
    const datos: VehiculoRequest = this.formulario.value;

    if (this.modoEdicion && this.vehiculoSeleccionado) {
      this.vehiculoService.actualizar(this.vehiculoSeleccionado.id, datos)
        .subscribe({
          next: () => {
            this.cargando = false;
            alert('Vehículo actualizado correctamente.');
            this.volverLista();
            this.cargarVehiculos();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al actualizar el vehículo.';
            this.cargando     = false;
          }
        });
    } else {
      this.vehiculoService.agregar(datos)
        .subscribe({
          next: () => {
            this.cargando = false;
            alert('Vehículo registrado correctamente.');
            this.volverLista();
            this.cargarVehiculos();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al registrar el vehículo.';
            this.cargando     = false;
          }
        });
    }
  }

  // Elimina un vehículo
  eliminar(id: number): void {
    if (!confirm('¿Está seguro que desea eliminar este vehículo?')) return;

    this.vehiculoService.borrar(id)
      .subscribe({
        next: () => {
          alert('Vehículo eliminado correctamente.');
          this.cargarVehiculos();
        },
        error: (err) => {
          alert(err.error?.mensaje || 'Error al eliminar el vehículo.');
        }
      });
  }

  // Cambiar página
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarVehiculos();
  }

  // Cambiar tamaño de página
  cambiarTamanioPagina(tamano: number): void {
    this.tamanioPagina = tamano;
    this.paginaActual  = 1;
    this.cargarVehiculos();
  }

  // Verifica si un campo tiene error
  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  // Limpia los mensajes
  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Retorna arreglo de páginas para paginación
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }
 
  // Abre el modal de disponibilidad
abrirDisponibilidad(vehiculo: Vehiculo): void {
  this.vehiculoDisponibilidad      = vehiculo;
  this.estadoDisponibilidad        = vehiculo.estadoDisponibilidad || 'Disponible';
  this.observacionesDisponibilidad = '';
  this.mostrarModalDisponibilidad  = true;
}
  // Cierra el modal de disponibilidad
cerrarDisponibilidad(): void {
  this.mostrarModalDisponibilidad = false;
  this.vehiculoDisponibilidad     = null;
}
 // Guarda el cambio de disponibilidad
guardarDisponibilidad(): void {
  if (!this.vehiculoDisponibilidad) return;

  this.vehiculoService.cambiarDisponibilidad(
    this.vehiculoDisponibilidad.id,
    this.estadoDisponibilidad,
    this.observacionesDisponibilidad
  ).subscribe({
    next: () => {
      alert('Disponibilidad actualizada correctamente.');
      this.cerrarDisponibilidad();
      this.cargarVehiculos();
    },
    error: (err) => {
      alert(err.error?.mensaje || 'Error al cambiar la disponibilidad.');
    }
  });
}
}

  