import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HistoricoKmService } from '../../servicios/historico-km.service';
import { HistoricoKilometraje, HistoricoKilometrajeRequest } from '../../modelos/historico-km.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';

@Component({
  selector: 'app-historico-km',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historico-km.html'
})
export class HistoricoKmComponent implements OnInit {

  // Lista de registros
  registros: HistoricoKilometraje[] = [];

  // Vehículos para filtro y formulario
  vehiculos: CatalogoItem[] = [];

  // Paginación
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;

  // Filtro
  filtroVehiculo: number = 0;

  // Control de vistas
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;

  // Registro seleccionado
  registroSeleccionado: HistoricoKilometraje | null = null;

  // Formulario
  formulario: FormGroup;

  // Mensajes
  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;

  constructor(
    private historicoKmService: HistoricoKmService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      idVehiculo:          ['', Validators.required],
      kilometrajInicial:   ['', [Validators.required, Validators.min(0)]],
      kilometrajeFinal:    ['', [Validators.required, Validators.min(0)]],
      combustibleEstimado: [0],
      observaciones:       [''],
    });
  }

  ngOnInit(): void {
    this.cargarRegistros();
    this.cargarVehiculos();
  }

  // Carga la lista de registros
  cargarRegistros(): void {
    this.cargando = true;
    this.historicoKmService.obtener(
      this.paginaActual,
      this.tamanioPagina,
      this.filtroVehiculo || undefined
    ).subscribe({
      next: (data) => {
        this.registros      = [...data.registros];
        this.totalRegistros = data.totalRegistros;
        this.totalPaginas   = data.totalPaginas;
        this.cargando       = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el histórico.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Carga vehículos
  cargarVehiculos(): void {
    this.historicoKmService.obtenerVehiculos()
      .subscribe({
        next: (data) => this.vehiculos = data,
        error: () => console.error('Error al cargar vehículos')
      });
  }

  // Muestra formulario para agregar
  mostrarAgregar(): void {
    this.mostrarLista      = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle    = false;
    this.formulario.reset({ combustibleEstimado: 0 });
    this.limpiarMensajes();
  }

  // Muestra detalle
  verDetalle(registro: HistoricoKilometraje): void {
    this.registroSeleccionado = registro;
    this.mostrarLista         = false;
    this.mostrarFormulario    = false;
    this.mostrarDetalle       = true;
  }

  // Vuelve a la lista
  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.limpiarMensajes();
  }

  // Guarda el registro
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!confirm('¿Está seguro que desea registrar este kilometraje?')) return;

    this.cargando = true;
    const datos: HistoricoKilometrajeRequest = this.formulario.value;

    this.historicoKmService.agregar(datos)
      .subscribe({
        next: () => {
          this.cargando = false;
          alert('Kilometraje registrado correctamente.');
          this.volverLista();
          this.cargarRegistros();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al registrar el kilometraje.';
          this.cargando     = false;
        }
      });
  }

  // Cambiar página
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarRegistros();
  }

  // Cambiar tamaño de página
  cambiarTamanioPagina(tamano: number): void {
    this.tamanioPagina = tamano;
    this.paginaActual  = 1;
    this.cargarRegistros();
  }

  // Filtrar por vehículo
  filtrar(): void {
    this.paginaActual = 1;
    this.cargarRegistros();
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtroVehiculo = 0;
    this.paginaActual   = 1;
    this.cargarRegistros();
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
}