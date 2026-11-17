import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CatalogoService } from '../servicios/catalogo.service';
import { CatalogoItem, CatalogoConfig } from '../modelos/catalogo.model';
import { ModalComponent } from '../shared/modal/modal';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './catalogo.html',
})
export class CatalogoComponent implements OnInit {
  // Configuración de catálogos disponibles
  catalogos: CatalogoConfig[] = [
    { tabla: 'TIPO_VEHICULO', titulo: 'Tipos de Vehículo', tieneEstado: true },
    { tabla: 'TIPO_COMBUSTIBLE', titulo: 'Tipos de Combustible', tieneEstado: true },
    { tabla: 'TIPO_TRANSMISION', titulo: 'Tipos de Transmisión', tieneEstado: true },
    { tabla: 'TIPO_LICENCIA', titulo: 'Tipos de Licencia', tieneEstado: true },
    { tabla: 'TIPO_SANGRE', titulo: 'Tipos de Sangre', tieneEstado: true },
    { tabla: 'TIPO_TELEFONO', titulo: 'Tipos de Teléfono', tieneEstado: true },
    { tabla: 'SEDE', titulo: 'Sedes', tieneEstado: true },
    { tabla: 'UNIDAD', titulo: 'Unidades', tieneEstado: true },
  ];

  // Catálogo seleccionado
  catalogoActual: CatalogoConfig = this.catalogos[0];

  // Lista de items
  items: CatalogoItem[] = [];

  // Control de vistas
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;

  // Item seleccionado
  itemSeleccionado: CatalogoItem | null = null;

  // ── Modal ─────────────────────────────────────────────────
  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalTipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';
  modalBtnAceptar: string = 'Confirmar';
  modalAccion: (() => void) | null = null;

  // Formulario
  formulario: FormGroup;

  // Mensajes
  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(
    private catalogoService: CatalogoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  // Cambia el catálogo activo
  seleccionarCatalogo(catalogo: CatalogoConfig): void {
    this.catalogoActual = catalogo;
    this.mostrarFormulario = false;
    this.limpiarMensajes();
    this.cargarCatalogo();
  }

  // Carga los items del catálogo actual
  cargarCatalogo(): void {
    this.cargando = true;
    this.obtenerItems().subscribe({
      next: (data) => {
        this.items = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el catálogo.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Obtiene los items según el catálogo actual
  obtenerItems() {
    switch (this.catalogoActual.tabla) {
      case 'TIPO_VEHICULO':
        return this.catalogoService.obtenerTiposVehiculo();
      case 'TIPO_COMBUSTIBLE':
        return this.catalogoService.obtenerTiposCombustible();
      case 'TIPO_TRANSMISION':
        return this.catalogoService.obtenerTiposTransmision();
      case 'TIPO_LICENCIA':
        return this.catalogoService.obtenerTiposLicencia();
      case 'TIPO_SANGRE':
        return this.catalogoService.obtenerTiposSangre();
      case 'TIPO_TELEFONO':
        return this.catalogoService.obtenerTiposTelefono();
      case 'SEDE':
        return this.catalogoService.obtenerSedes();
      default:
        return this.catalogoService.obtenerUnidades();
    }
  }

  // Muestra formulario para agregar
  mostrarAgregar(): void {
    this.modoEdicion = false;
    this.itemSeleccionado = null;
    this.mostrarFormulario = true;
    this.formulario.reset();
    this.limpiarMensajes();
  }

  // Muestra formulario para editar
  mostrarEditar(item: CatalogoItem): void {
    this.modoEdicion = true;
    this.itemSeleccionado = item;
    this.mostrarFormulario = true;
    this.limpiarMensajes();
    this.formulario.patchValue({ nombre: item.nombre });
  }

  // Cancela el formulario
  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
    this.limpiarMensajes();
  }

  // Guarda el item
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const nombre = this.formulario.value.nombre.toUpperCase();

    if (this.modoEdicion && this.itemSeleccionado) {
      this.catalogoService
        .actualizar(this.itemSeleccionado.id, {
          tabla: this.catalogoActual.tabla,
          nombre,
        })
        .subscribe({
          next: () => {
            this.mensajeExito = 'Registro actualizado correctamente.';
            this.mostrarFormulario = false;
            this.cargarCatalogo();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al actualizar.';
          },
        });
    } else {
      this.catalogoService
        .agregar({
          tabla: this.catalogoActual.tabla,
          nombre,
        })
        .subscribe({
          next: () => {
            this.mensajeExito = 'Registro agregado correctamente.';
            this.mostrarFormulario = false;
            this.cargarCatalogo();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al agregar.';
          },
        });
    }
  }

  // Cambia el estado de un item
  cambiarEstado(item: CatalogoItem): void {
    const nuevoEstado = item.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';

    this.modalTitulo = nuevoEstado === 1 ? 'Activar Registro' : 'Desactivar Registro';
    this.modalMensaje = `¿Está seguro que desea ${accion} este registro?`;
    this.modalTipo = nuevoEstado === 1 ? 'confirmar' : 'peligro';
    this.modalBtnAceptar = nuevoEstado === 1 ? 'Activar' : 'Desactivar';
    this.modalAccion = () => {
      this.catalogoService
        .cambiarEstado(item.id, {
          tabla: this.catalogoActual.tabla,
          estado: nuevoEstado,
        })
        .subscribe({
          next: () => {
            this.mensajeExito = `Registro ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`;
            this.cargarCatalogo();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al cambiar estado.';
          },
        });
    };
    this.modalVisible = true;
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
}
