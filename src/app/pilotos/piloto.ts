import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PilotoService } from '../servicios/piloto.service';
import { Piloto, PilotoRequest, PilotoCatalogos, Telefono, TelefonoRequest } from '../modelos/piloto.model';

@Component({
  selector: 'app-piloto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './piloto.html',
  styleUrl: './piloto.css'
})
export class PilotoComponent implements OnInit {

  // Lista de pilotos
  pilotos: Piloto[] = [];

  // Catálogos
  catalogos: PilotoCatalogos = {
    sexos:         [],
    tiposSangre:   [],
    tiposLicencia: [],
    unidades:      [],
    tiposTelefono: []
  };

  // Teléfonos del piloto seleccionado
  telefonos: Telefono[] = [];

  // Paginación
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;

  // Búsqueda
  textoBusqueda:  string = '';
  private busquedaSubject = new Subject<string>();

  // Control de vistas
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;
  modoEdicion:       boolean = false;

  // Piloto seleccionado
  pilotoSeleccionado: Piloto | null = null;

  // Formulario reactivo
  formulario: FormGroup;

  // Formulario de teléfono
  formularioTelefono: FormGroup;

  // Mensajes
  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;

  constructor(
    private pilotoService: PilotoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      nombre:          ['', [Validators.required, Validators.maxLength(50)]],
      apellidos:       ['', [Validators.required, Validators.maxLength(50)]],
      dpi:             ['', [Validators.required, Validators.maxLength(20)]],
      nit:             [''],
      correo:          ['', [Validators.email]],
      direccion:       [''],
      fechaNacimiento: [''],
      fechaIngreso:    [''],
      idSexo:          ['', Validators.required],
      idTipoSangre:    ['', Validators.required],
      noLicencia:      ['', Validators.required],
      idTipoLicencia:  ['', Validators.required],
      fechaVencimiento:['', Validators.required],
      idUnidad:        ['', Validators.required],
    });

    this.formularioTelefono = this.fb.group({
      numero:         ['', Validators.required],
      idTipoTelefono: ['', Validators.required],
    });

    // Búsqueda en tiempo real
    this.busquedaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 1;
      this.cargarPilotos();
    });
  }

  ngOnInit(): void {
    this.cargarPilotos();
    this.cargarCatalogos();
  }

  // Carga la lista de pilotos
  cargarPilotos(): void {
    this.cargando = true;
    this.pilotoService.obtener(this.paginaActual, this.tamanioPagina, this.textoBusqueda)
      .subscribe({
        next: (data) => {
          this.pilotos        = [...data.pilotos];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas   = data.totalPaginas;
          this.cargando       = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar pilotos.';
          this.cargando     = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Carga los catálogos
  cargarCatalogos(): void {
    this.pilotoService.obtenerCatalogos()
      .subscribe({
        next: (data) => this.catalogos = data,
        error: () => console.error('Error al cargar catálogos')
      });
  }

  // Búsqueda en tiempo real
  buscarEnTiempoReal(): void {
    this.busquedaSubject.next(this.textoBusqueda);
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarPilotos();
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.paginaActual  = 1;
    this.cargarPilotos();
  }

  // Muestra formulario para agregar
  mostrarAgregar(): void {
    this.modoEdicion       = false;
    this.mostrarLista      = false;
    this.mostrarFormulario = true;
    this.mostrarDetalle    = false;
    this.telefonos         = [];
    this.formulario.reset();
    this.formularioTelefono.reset();
    this.limpiarMensajes();
  }

  // Muestra formulario para editar
  mostrarEditar(piloto: Piloto): void {
    this.modoEdicion          = true;
    this.pilotoSeleccionado   = piloto;
    this.mostrarLista         = false;
    this.mostrarFormulario    = true;
    this.mostrarDetalle       = false;
    this.limpiarMensajes();

    // Cargar teléfonos
    this.pilotoService.obtenerTelefonos(piloto.id).subscribe({
      next: (data) => this.telefonos = data,
      error: () => this.telefonos = []
    });

    this.formulario.patchValue({
      nombre:           piloto.nombre,
      apellidos:        piloto.apellidos,
      dpi:              piloto.dpi,
      nit:              piloto.nit,
      correo:           piloto.correo,
      direccion:        piloto.direccion,
      fechaNacimiento:  piloto.fechaNacimiento ? piloto.fechaNacimiento.substring(0, 10) : '',
      fechaIngreso:     piloto.fechaIngreso ? piloto.fechaIngreso.substring(0, 10) : '',
      idSexo:           Number(piloto.idSexo),
      idTipoSangre:     Number(piloto.idTipoSangre),
      noLicencia:       piloto.noLicencia,
      idTipoLicencia:   Number(piloto.idTipoLicencia),
      fechaVencimiento: piloto.fechaVencimiento ? piloto.fechaVencimiento.substring(0, 10) : '',
      idUnidad:         Number(piloto.idUnidad),
    });
  }

  // Muestra detalle
  verDetalle(piloto: Piloto): void {
    this.pilotoSeleccionado = piloto;
    this.mostrarLista       = false;
    this.mostrarFormulario  = false;
    this.mostrarDetalle     = true;

    this.pilotoService.obtenerTelefonos(piloto.id).subscribe({
      next: (data) => this.telefonos = data,
      error: () => this.telefonos = []
    });
  }

  // Vuelve a la lista
  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.limpiarMensajes();
  }

  // Guarda el piloto
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!confirm(this.modoEdicion
      ? '¿Está seguro que desea actualizar este piloto?'
      : '¿Está seguro que desea registrar este piloto?'))
      return;

    this.cargando = true;
    const datos: PilotoRequest = this.formulario.value;

    // Limpiar fechas vacías
if (!datos.fechaNacimiento)  datos.fechaNacimiento  = undefined;
if (!datos.fechaIngreso)     datos.fechaIngreso     = undefined;
if (!datos.fechaVencimiento) datos.fechaVencimiento = undefined;

   if (this.modoEdicion && this.pilotoSeleccionado) {
  console.log('>>> Actualizando piloto ID:', this.pilotoSeleccionado.id);
  console.log('>>> Datos:', JSON.stringify(datos));

  
  this.pilotoService.actualizar(this.pilotoSeleccionado.id, datos)
        .subscribe({
          next: () => {
            this.cargando = false;
            alert('Piloto actualizado correctamente.');
            this.volverLista();
            this.cargarPilotos();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al actualizar el piloto.';
            this.cargando     = false;
          }
        });
    } else {
      this.pilotoService.agregar(datos)
        .subscribe({
          next: () => {
            this.cargando = false;
            alert('Piloto registrado correctamente.');
            this.volverLista();
            this.cargarPilotos();
          },
          error: (err) => {
            this.mensajeError = err.error?.mensaje || 'Error al registrar el piloto.';
            this.cargando     = false;
          }
        });
    }
  }

  // Elimina un piloto
  eliminar(id: number): void {
    if (!confirm('¿Está seguro que desea eliminar este piloto?')) return;

    this.pilotoService.borrar(id)
      .subscribe({
        next: () => {
          alert('Piloto eliminado correctamente.');
          this.cargarPilotos();
        },
        error: (err) => {
          alert(err.error?.mensaje || 'Error al eliminar el piloto.');
        }
      });
  }

  // Agrega un teléfono
  agregarTelefono(): void {
    if (this.formularioTelefono.invalid) {
      this.formularioTelefono.markAllAsTouched();
      return;
    }

    if (!this.pilotoSeleccionado) return;

    const datos: TelefonoRequest = this.formularioTelefono.value;

    this.pilotoService.agregarTelefono(this.pilotoSeleccionado.id, datos)
      .subscribe({
        next: () => {
          this.formularioTelefono.reset();
          this.pilotoService.obtenerTelefonos(this.pilotoSeleccionado!.id)
            .subscribe({ next: (data) => this.telefonos = data });
        },
        error: (err) => {
          alert(err.error?.mensaje || 'Error al agregar teléfono.');
        }
      });
  }

  // Elimina un teléfono
  eliminarTelefono(id: number): void {
    if (!confirm('¿Eliminar este teléfono?')) return;

    this.pilotoService.eliminarTelefono(id)
      .subscribe({
        next: () => {
          this.telefonos = this.telefonos.filter(t => t.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert(err.error?.mensaje || 'Error al eliminar teléfono.');
        }
      });
  }

  // Cambiar página
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarPilotos();
  }

  // Cambiar tamaño de página
  cambiarTamanioPagina(tamano: number): void {
    this.tamanioPagina = tamano;
    this.paginaActual  = 1;
    this.cargarPilotos();
  }

  // Verifica si un campo tiene error
  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  tieneErrorTelefono(campo: string): boolean {
    const control = this.formularioTelefono.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  // Limpia mensajes
  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Verifica si la licencia está vencida
estaVencida(fecha?: string): boolean {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

// Verifica si la licencia está por vencer (menos de 30 días)
estaPorVencer(fecha?: string): boolean {
  if (!fecha) return false;
  const fechaVenc = new Date(fecha);
  const hoy       = new Date();
  const diff      = (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
} 
  // Retorna arreglo de páginas
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }


}