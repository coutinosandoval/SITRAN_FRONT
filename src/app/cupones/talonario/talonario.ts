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
  Talonario,
  TalonarioRequest,
  TalonarioTrasladar,
  TalonarioDevolver,
  BitacoraTalonario,
} from '../../modelos/cupon.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';
import { AuthService } from '../../servicios/auth.service';
import { ModalComponent } from '../../shared/modal/modal';

@Component({
  selector: 'app-talonario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './talonario.html',
})
export class TalonarioComponent implements OnInit {
  // ─── Listas ───
  talonarios: Talonario[] = [];
  sedes: CatalogoItem[] = [];
  expendedores: CatalogoItem[] = [];
  cuponesInfo: any[] = [];
  bitacora: BitacoraTalonario[] = [];
  sedesConSolicitud: CatalogoItem[] = [];
  expendedoresFiltrados: CatalogoItem[] = [];

  // ─── Paginación ───
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  totalRegistros: number = 0;
  totalPaginas: number = 0;
  filtroEstado: number = 0;

  // ─── Búsqueda expendedor ───
  busquedaExpendedor: string = '';
  mostrarDropdown: boolean = false;
  expendedorSeleccionado: CatalogoItem | null = null;

  // ─── Visibilidad de vistas ───
  mostrarLista: boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarTraslado: boolean = false;
  mostrarDevolucion: boolean = false;
  mostrarCuponesInfo: boolean = false;
  mostrarUtilizados: boolean = false;
  mostrarDisponibles: boolean = false;
  mostrarDevolucionBodega: boolean = false;
  mostrarDevolucionCompras: boolean = false;
  mostrarDevolucionProveedor: boolean = false;

  // ─── Roles ───
  esDelegado: boolean = false;
  esCompras: boolean = false;
  esAdmin: boolean = false;
  esBodega: boolean = false;
  idSedeUsuario: number | null = null;

  // ─── Selección ───
  talonarioSeleccionado: Talonario | null = null;

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

  estados = [
    { id: 0, nombre: 'Todos' },
    { id: 1, nombre: 'Disponible' },
    { id: 2, nombre: 'En Bodega' },
    { id: 3, nombre: 'En Sede' },
    { id: 4, nombre: 'Devuelto a Bodega' },
    { id: 5, nombre: 'Devuelto de Bodega' },
    { id: 6, nombre: 'Devuelto a Proveedor' },
  ];

  valores = [50, 100];

  // ─── Formularios ───
  formulario: FormGroup;
  formularioTraslado: FormGroup;
  formularioDevolver: FormGroup;
  formularioDevolucionBodega: FormGroup;
  formularioDevolucionCompras: FormGroup;
  formularioDevolucionProveedor: FormGroup;

  mensajeExito: string = '';
  mensajeError: string = '';
  cargando: boolean = false;

  constructor(
    private cuponService: CuponService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    this.formulario = this.fb.group({
      fechaCompra: ['', Validators.required],
      idExpendedor: ['', Validators.required],
      cantidadCupones: [
        '',
        [Validators.required, Validators.min(100), Validators.pattern('^[0-9]*00$')],
      ],
      valorCupon: [100, Validators.required],
      fechaEmision: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      observaciones: [''],
    });

    this.formularioTraslado = this.fb.group({
      idSedeTraslado: ['', Validators.required],
      fechaTraslado: ['', Validators.required],
      trasladadoPor: ['', Validators.required],
      retornadoPor: ['', Validators.required],
    });

    this.formularioDevolver = this.fb.group({
      cuponesRetornados: ['', [Validators.required, Validators.min(1)]],
      fechaRetorno: ['', Validators.required],
      retornadoPor: ['', Validators.required],
    });

    this.formularioDevolucionBodega = this.fb.group({
      cuponesRetornados: ['', [Validators.required, Validators.min(1)]],
    });

    this.formularioDevolucionCompras = this.fb.group({
      cuponesRetornados: ['', [Validators.required, Validators.min(1)]],
    });

    this.formularioDevolucionProveedor = this.fb.group({
      cuponesRetornados: ['', [Validators.required, Validators.min(1)]],
      observacion: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.esAdmin = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.esCompras = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.esBodega = this.authService.tienePermiso('GESTIONAR_SOLICITUDES_CUPONES');
    this.esDelegado = this.authService.tienePermiso('SOLICITAR_CUPONES');
    this.idSedeUsuario = this.authService.obtenerIdUnidad();
    this.cargarTalonarios();
    this.cargarSedes();
    this.cargarExpendedores();
    if (this.esBodega) {
      this.cargarSedesConSolicitud();
    }
  }

  // ─── Carga de datos ───

  cargarSedesConSolicitud(): void {
    this.cuponService.obtenerSedesConSolicitudPendiente().subscribe({
      next: (data) => {
        this.sedesConSolicitud = data;
        this.cdr.detectChanges();
      },
    });
  }

  cargarTalonarios(): void {
    this.cargando = true;
    let estado: number | undefined = this.filtroEstado || undefined;
    let idSede: number | undefined = undefined;

    if (this.esBodega) {
      estado = 2;
      idSede = 41;
    } else if (this.esCompras) {
      estado = this.filtroEstado || undefined;
      idSede = undefined;
    } else if (this.esDelegado) {
      estado = this.filtroEstado || undefined;
      idSede = this.idSedeUsuario ?? undefined;
    }

    this.cuponService
      .obtenerTalonarios(this.paginaActual, this.tamanioPagina, estado, idSede)
      .subscribe({
        next: (data) => {
          this.talonarios = [...data.talonarios];
          this.totalRegistros = data.totalRegistros;
          this.totalPaginas = data.totalPaginas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar talonarios.';
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  cargarSedes(): void {
    this.cuponService.obtenerSedes().subscribe({ next: (data) => (this.sedes = data) });
  }

  cargarExpendedores(): void {
    this.cuponService
      .obtenerExpendedores()
      .subscribe({ next: (data) => (this.expendedores = data) });
  }

  cargarBitacora(idTalonario: number): void {
    this.bitacora = [];
    this.cuponService.obtenerBitacora(idTalonario).subscribe({
      next: (data) => {
        this.bitacora = data;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Expendedor autobúsqueda ───

  filtrarExpendedores(): void {
    const texto = this.busquedaExpendedor.toLowerCase();
    this.expendedoresFiltrados = this.expendedores.filter((e) =>
      e.nombre.toLowerCase().includes(texto),
    );
    this.mostrarDropdown = this.expendedoresFiltrados.length > 0 && texto.length > 0;
  }

  seleccionarExpendedor(e: CatalogoItem): void {
    this.expendedorSeleccionado = e;
    this.busquedaExpendedor = e.nombre;
    this.mostrarDropdown = false;
    this.formulario.patchValue({ idExpendedor: e.id });
  }

  limpiarExpendedor(): void {
    this.expendedorSeleccionado = null;
    this.busquedaExpendedor = '';
    this.mostrarDropdown = false;
    this.formulario.patchValue({ idExpendedor: '' });
  }

  // ─── Navegación ───

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarTalonarios();
  }

  ocultarTodo(): void {
    this.mostrarLista = false;
    this.mostrarFormulario = false;
    this.mostrarDetalle = false;
    this.mostrarTraslado = false;
    this.mostrarDevolucion = false;
    this.mostrarCuponesInfo = false;
    this.mostrarDevolucionBodega = false;
    this.mostrarDevolucionCompras = false;
    this.mostrarDevolucionProveedor = false;
  }

  mostrarAgregar(): void {
    this.ocultarTodo();
    this.mostrarFormulario = true;
    this.expendedorSeleccionado = null;
    this.busquedaExpendedor = '';
    this.mostrarDropdown = false;
    this.formulario.reset({ cantidadCupones: '', valorCupon: 100 });
    this.limpiarMensajes();
  }

  verDetalle(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.ocultarTodo();
    this.mostrarDetalle = true;
    this.cargarBitacora(t.id);
  }

  abrirTraslado(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.ocultarTodo();
    this.mostrarTraslado = true;

    const hoy = new Date().toISOString().substring(0, 10);
    if (this.esAdmin || this.esCompras) {
      this.formularioTraslado.get('idSedeTraslado')?.disable();
    } else {
      this.formularioTraslado.get('idSedeTraslado')?.enable();
    }

    setTimeout(() => {
      this.formularioTraslado.patchValue({
        idSedeTraslado: this.esAdmin || this.esCompras ? 41 : '',
        fechaTraslado: hoy,
        trasladadoPor: this.authService.obtenerNombre(),
        retornadoPor: '',
      });
      this.cdr.detectChanges();
    }, 0);
    this.limpiarMensajes();
  }

  abrirDevolucionBodega(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.ocultarTodo();
    this.mostrarDevolucionBodega = true;
    this.formularioDevolucionBodega.reset();
    this.limpiarMensajes();
  }

  abrirDevolucionCompras(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.ocultarTodo();
    this.mostrarDevolucionCompras = true;
    this.formularioDevolucionCompras.reset();
    this.limpiarMensajes();
  }

  abrirDevolucionProveedor(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.ocultarTodo();
    this.mostrarDevolucionProveedor = true;
    this.formularioDevolucionProveedor.reset();
    this.limpiarMensajes();
  }

  volverLista(): void {
    this.ocultarTodo();
    this.mostrarLista = true;
    this.limpiarMensajes();
  }

  // ─── Acciones con modal ───

  /** Registrar compra de talonarios */
  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (!this.expendedorSeleccionado) {
      this.mensajeError = 'Debe seleccionar un expendedor.';
      return;
    }
    this.modalTitulo = 'Confirmar Registro';
    this.modalMensaje = `¿Está seguro que desea registrar la compra de <strong>${this.formulario.value.cantidadCupones}</strong> cupones de <strong>Q${this.formulario.value.valorCupon}.00</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Registrar Compra';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarGuardar();
  }

  private _ejecutarGuardar(): void {
    this.cargando = true;
    const v = this.formulario.value;
    const dto: TalonarioRequest = {
      fechaCompra: v.fechaCompra || undefined,
      idExpendedor: Number(v.idExpendedor),
      cantidadCupones: Number(v.cantidadCupones),
      valorCupon: Number(v.valorCupon),
      fechaEmision: v.fechaEmision || undefined,
      fechaVencimiento: v.fechaVencimiento || undefined,
      observaciones: v.observaciones || undefined,
      idComprador: 0,
    };
    this.cuponService.agregarTalonario(dto).subscribe({
      next: () => {
        this.cargando = false;
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar el talonario.';
        this.cargando = false;
      },
    });
  }

  /** Trasladar talonario */
  guardarTraslado(): void {
    if (this.formularioTraslado.invalid) {
      this.formularioTraslado.markAllAsTouched();
      return;
    }
    const destino = this.esAdmin || this.esCompras ? 'Bodega' : 'la sede seleccionada';
    this.modalTitulo = 'Confirmar Traslado';
    this.modalMensaje = `¿Está seguro que desea trasladar el <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> a <strong>${destino}</strong>?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Trasladar';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarTraslado();
  }

  private _ejecutarTraslado(): void {
    const v = this.formularioTraslado.getRawValue();
    const dto: TalonarioTrasladar = {
      idSedeTraslado: Number(v.idSedeTraslado),
      fechaTraslado: v.fechaTraslado || undefined,
      trasladadoPor: v.trasladadoPor,
      retornadoPor: v.retornadoPor,
    };
    this.cuponService.trasladarTalonario(this.talonarioSeleccionado!.id, dto).subscribe({
      next: () => {
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al trasladar el talonario.';
      },
    });
  }

  /** Devolver cupones a Bodega */
  guardarDevolucionBodega(): void {
    if (this.formularioDevolucionBodega.invalid) {
      this.formularioDevolucionBodega.markAllAsTouched();
      return;
    }
    const v = this.formularioDevolucionBodega.value;
    this.modalTitulo = 'Devolver a Bodega';
    this.modalMensaje = `¿Confirma devolver <strong>${v.cuponesRetornados}</strong> cupones del <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> a Bodega?`;
    this.modalTipo = 'devolucion';
    this.modalBtnAceptar = 'Confirmar Devolución';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarDevolucionBodega();
  }

  private _ejecutarDevolucionBodega(): void {
    const v = this.formularioDevolucionBodega.value;
    const usuario = this.authService.obtenerNombre();
    const dto: TalonarioDevolver = {
      cuponesRetornados: Number(v.cuponesRetornados),
      retornadoPor: usuario,
    };
    this.cuponService.devolverABodega(this.talonarioSeleccionado!.id, dto).subscribe({
      next: () => {
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al devolver a Bodega.';
      },
    });
  }

  /** Devolver cupones a Compras */
  guardarDevolucionCompras(): void {
    if (this.formularioDevolucionCompras.invalid) {
      this.formularioDevolucionCompras.markAllAsTouched();
      return;
    }
    const v = this.formularioDevolucionCompras.value;
    this.modalTitulo = 'Devolver a Compras';
    this.modalMensaje = `¿Confirma devolver <strong>${v.cuponesRetornados}</strong> cupones del <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> a Compras?`;
    this.modalTipo = 'devolucion';
    this.modalBtnAceptar = 'Confirmar Devolución';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarDevolucionCompras();
  }

  private _ejecutarDevolucionCompras(): void {
    const v = this.formularioDevolucionCompras.value;
    const usuario = this.authService.obtenerNombre();
    const dto: TalonarioDevolver = {
      cuponesRetornados: Number(v.cuponesRetornados),
      retornadoPor: usuario,
    };
    this.cuponService.devolverACompras(this.talonarioSeleccionado!.id, dto).subscribe({
      next: () => {
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al devolver a Compras.';
      },
    });
  }

  /** Devolver al Proveedor */
  guardarDevolucionProveedor(): void {
    if (this.formularioDevolucionProveedor.invalid) {
      this.formularioDevolucionProveedor.markAllAsTouched();
      return;
    }
    this.modalTitulo = 'Devolver al Proveedor';
    this.modalMensaje = `¿Confirma marcar el <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> como devuelto al proveedor? Esta acción es definitiva.`;
    this.modalTipo = 'peligro';
    this.modalBtnAceptar = 'Confirmar Devolución';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarDevolucionProveedor();
  }

  private _ejecutarDevolucionProveedor(): void {
    const v = this.formularioDevolucionProveedor.value;
    const usuario = this.authService.obtenerNombre();
    this.cuponService
      .devolverAProveedor(this.talonarioSeleccionado!.id, {
        cuponesRetornados: Number(v.cuponesRetornados),
        devueltoPor: usuario,
        observacion: v.observacion,
      })
      .subscribe({
        next: () => {
          this.volverLista();
          this.cargarTalonarios();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al devolver al proveedor.';
        },
      });
  }

  /** Regresar talonario a Compras */
  regresarACompras(): void {
    if (!this.talonarioSeleccionado) return;
    this.modalTitulo = 'Regresar a Compras';
    this.modalMensaje = `¿Está seguro que desea regresar el <strong>Talonario #${this.talonarioSeleccionado.id}</strong> a Compras? Los cupones disponibles serán devueltos.`;
    this.modalTipo = 'peligro';
    this.modalBtnAceptar = 'Regresar a Compras';
    this.modalConTexto = false;
    this.modalConNumero = false;
    this.modalVisible = true;
    this.modalAccion = () => this._ejecutarRegresarACompras();
  }

  private _ejecutarRegresarACompras(): void {
    this.cuponService.regresarACompras(this.talonarioSeleccionado!.id).subscribe({
      next: () => {
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al regresar el talonario.';
      },
    });
  }

  /** Maneja el evento aceptar del modal */
  onModalAceptar(evento: { texto?: string; numero?: number }): void {
    this.modalVisible = false;
    if (this.modalAccion) {
      this.modalAccion();
      this.modalAccion = null;
    }
  }

  /** Maneja el evento cancelar del modal */
  onModalCancelar(): void {
    this.modalVisible = false;
    this.modalAccion = null;
  }

  // ─── Paginación ───

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarTalonarios();
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

  colorEstado(estado: number): string {
    switch (estado) {
      case 1:
        return 'bg-success';
      case 2:
        return 'bg-primary';
      case 3:
        return 'bg-warning text-dark';
      case 4:
        return 'bg-info text-dark';
      case 5:
        return 'bg-secondary';
      case 6:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  nombreEstado(estado: number): string {
    switch (estado) {
      case 1:
        return 'Disponible';
      case 2:
        return 'En Bodega';
      case 3:
        return 'En Sede';
      case 4:
        return 'Devuelto a Bodega';
      case 5:
        return 'Devuelto de Bodega';
      case 6:
        return 'Devuelto a Proveedor';
      default:
        return 'Desconocido';
    }
  }

  colorMovimiento(tipo?: string): string {
    switch (tipo) {
      case 'COMPRA':
        return 'bg-success';
      case 'TRASLADO':
        return 'bg-primary';
      case 'DEVOLUCION_BODEGA':
        return 'bg-info text-dark';
      case 'DEVOLUCION_COMPRAS':
        return 'bg-secondary';
      case 'DEVOLUCION_PROVEEDOR':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  iconoMovimiento(tipo?: string): string {
    switch (tipo) {
      case 'COMPRA':
        return 'bi-cart-check';
      case 'TRASLADO':
        return 'bi-arrow-right-circle';
      case 'DEVOLUCION_BODEGA':
        return 'bi-arrow-return-left';
      case 'DEVOLUCION_COMPRAS':
        return 'bi-arrow-return-left';
      case 'DEVOLUCION_PROVEEDOR':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }

  verCuponesInfo(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.cuponesInfo = [];
    this.ocultarTodo();
    this.mostrarCuponesInfo = true;
    this.cuponService.obtenerCuponesInfo(t.id).subscribe({
      next: (data) => {
        this.cuponesInfo = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar información de cupones.';
      },
    });
  }

  get cuponesUtilizados(): any[] {
    return this.cuponesInfo.filter((c) => c.disponibilidad === 'Entregado');
  }

  get cuponesDisponibles(): any[] {
    return this.cuponesInfo.filter((c) => c.disponibilidad === 'Disponible');
  }

  get cuponesDevueltos(): any[] {
    return this.cuponesInfo.filter((c) => c.disponibilidad === 'Devuelto');
  }
}
