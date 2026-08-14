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
  TalonarioTrasladar,
  TalonarioDevolver,
  BitacoraTalonario,
} from '../../modelos/cupon.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';
import { AuthService } from '../../servicios/auth.service';
import { ModalComponent } from '../../shared/modal/modal';

/** Una línea del formulario de compra — un rango de cupones */
interface LineaRango {
  denominacion: number | null;
  numeroDel: number | null;
  numeroAl: number | null;
  error: string;
}

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
  inventarioBodegaAgrupado: any[] = [];

  // Inventario agrupado para Delegado
  inventarioDelegadoAgrupado: any[] = [];

  // ─── Líneas dinámicas del formulario de compra (rangos) ───
  lineasRango: LineaRango[] = [];

  // ─── Compras (nuevo módulo) ───
  compras: any[] = [];
  totalCompras: number = 0;
  talonariosBodega: any[] = [];

  // Control de expandibles en inventario agrupado
  denominacionExpandida: number | null = null;
  detalleDenominacion: any[] = [];

  denominacionAsignadaExpandida: number | null = null;
  detalleAsignados: any[] = [];

  denominacionVencidaExpandida: number | null = null;
  denominacionPorVencerExpandida: number | null = null;
  detalleVencidos: any[] = [];
  detallePorVencer: any[] = [];

  // Expandibles delegado
  denominacionDelegadoExpandida: number | null = null;
  detalleDelegadoDisponibles: any[] = [];

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
    // Formulario de compra — solo campos generales
    // Los rangos se manejan en lineasRango[]
    this.formulario = this.fb.group({
      fechaCompra: ['', Validators.required],
      idExpendedor: ['', Validators.required],
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
    this.esDelegado = this.authService.tienePermiso('SOLICITAR_CUPONES');
    this.idSedeUsuario = this.authService.obtenerIdSede();
    console.log('>>> ngOnInit - esDelegado:', this.esDelegado, 'idSede:', this.idSedeUsuario);
    this.esAdmin = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.esCompras = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.esBodega = this.authService.tienePermiso('GESTIONAR_SOLICITUDES_CUPONES');
    this.esDelegado = this.authService.tienePermiso('SOLICITAR_CUPONES');
    this.idSedeUsuario = this.authService.obtenerIdSede();
    if (this.esCompras || this.esAdmin) {
      this.cargarCompras();
    } else {
      this.cargarTalonarios();
    }
    this.cargarSedes();
    this.cargarExpendedores();
    if (this.esBodega) {
      this.cargarSedesConSolicitud();
    }
    if (this.esDelegado) {
      this.cargarInventarioDelegado();
    }
    if (this.esDelegado) {
      this.cargarInventarioDelegado();
    }
  }

  /** Expande o colapsa el detalle de asignados de una denominación */
  toggleDetalleAsignados(denominacion: number): void {
    if (this.denominacionAsignadaExpandida === denominacion) {
      this.denominacionAsignadaExpandida = null;
      this.detalleAsignados = [];
      this.cdr.detectChanges();
      return;
    }

    this.denominacionAsignadaExpandida = denominacion;
    this.cuponService.obtenerAsignadosDetalle(denominacion).subscribe({
      next: (data) => {
        // Generar números asignados por rango
        this.detalleAsignados = data.map((r: any) => {
          const numeros: number[] = [];
          // Mostrar todos los números del rango asignado a la sede
          for (let i = r.numeroDel; i <= r.numeroAl; i++) {
            numeros.push(i);
          }
          return { ...r, numerosAsignados: numeros };
        });
        this.cdr.detectChanges();
      },
    });
  }

  cargarCompras(): void {
    this.cargando = true;
    this.cuponService.obtenerCompras(this.paginaActual, this.tamanioPagina).subscribe({
      next: (data) => {
        this.compras = data.datos;
        this.totalCompras = data.total;
        this.totalPaginas = Math.ceil(data.total / this.tamanioPagina);
        this.totalRegistros = data.total;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar compras.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Expande/colapsa cupones vencidos por denominación ────
  // Filtra del inventario local los rangos cuya fecha de vencimiento ya pasó
  // y genera los números individuales de cupones vencidos disponibles
  toggleDetalleVencidos(denominacion: number): void {
    if (this.denominacionVencidaExpandida === denominacion) {
      this.denominacionVencidaExpandida = null;
      this.detalleVencidos = [];
      this.cdr.detectChanges();
      return;
    }
    this.denominacionVencidaExpandida = denominacion;
    // Filtrar rangos vencidos del inventario individual
    const rangos = this.talonariosBodega.filter(
      (t: any) => t.denominacion === denominacion && this.estaVencido(t.fechaVencimiento),
    );
    this.detalleVencidos = rangos.map((r: any) => {
      const numeros: number[] = [];
      const entregados = r.cantidad - r.disponibles;
      const primerDisp = r.numeroDel + entregados;
      for (let i = primerDisp; i <= r.numeroAl; i++) {
        numeros.push(i);
      }
      return { ...r, numerosVencidos: numeros };
    });
    this.cdr.detectChanges();
  }

  /** Expande cupones por vencer por denominación */
  toggleDetallePorVencer(denominacion: number): void {
    if (this.denominacionPorVencerExpandida === denominacion) {
      this.denominacionPorVencerExpandida = null;
      this.detallePorVencer = [];
      this.cdr.detectChanges();
      return;
    }

    this.denominacionPorVencerExpandida = denominacion;

    // Filtrar rangos próximos a vencer del inventario individual
    const rangos = this.talonariosBodega.filter(
      (t: any) => t.denominacion === denominacion && this.estaProximoVencer(t.fechaVencimiento),
    );

    this.detallePorVencer = rangos.map((r: any) => {
      const numeros: number[] = [];
      const totalRango = r.numeroAl - r.numeroDel + 1;
      const entregados = totalRango - r.disponibles;
      const primerDisp = r.numeroDel + entregados;
      for (let i = primerDisp; i <= r.numeroAl; i++) {
        numeros.push(i);
      }
      return { ...r, numerosPorVencer: numeros };
    });

    this.cdr.detectChanges();
  }

  /** Abre formulario para asignar cupones de bodega a una sede */
  abrirTrasladoNuevo(item: any): void {
    // TODO: implementar traslado nuevo modelo
    console.log('Traslado nuevo modelo:', item);
  }

  toggleRangos(compra: any): void {
    compra._expandido = !compra._expandido;
    if (compra._expandido && !compra._rangos) {
      this.cuponService.obtenerDetalleCompra(compra.id).subscribe({
        next: (rangos) => {
          compra._rangos = rangos;
          this.cdr.detectChanges();
        },
        error: () => {
          compra._rangos = [];
        },
      });
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
    console.log('>>> cargarTalonarios - esBodega:', this.esBodega, 'esDelegado:', this.esDelegado);
    this.cargando = true;

    if (this.esBodega) {
      // Cargar inventario individual
      this.cuponService.obtenerInventarioBodega().subscribe({
        next: (data) => {
          this.talonariosBodega = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'Error al cargar inventario bodega.';
          this.cargando = false;
        },
      });

      // Cargar inventario agrupado
      this.cuponService.obtenerInventarioBodegaAgrupado().subscribe({
        next: (data) => {
          this.inventarioBodegaAgrupado = data;
          this.cdr.detectChanges();
        },
      });
      return;
    }

    // Resto del código existente para Compras y Delegado...
    let estado: number | undefined = this.filtroEstado || undefined;
    let idSede: number | undefined = undefined;

    if (this.esCompras) {
      estado = this.filtroEstado || undefined;
      idSede = undefined;
    } else if (this.esDelegado) {
      estado = this.filtroEstado || undefined;
      idSede = this.idSedeUsuario ?? undefined;
      // Cargar inventario agrupado para delegado
      if (this.esDelegado) this.cargarInventarioDelegado();
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
    this.cuponService.obtenerSedes().subscribe({
      next: (data) => (this.sedes = data),
    });
  }

  cargarExpendedores(): void {
    this.cuponService.obtenerExpendedores().subscribe({
      next: (data) => (this.expendedores = data),
    });
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
    if (this.esCompras || this.esAdmin) {
      this.cargarCompras();
    } else {
      this.cargarTalonarios();
    }
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
    this.formulario.reset();
    // Inicia con una línea vacía de rango
    this.lineasRango = [this.lineaRangoVacia()];
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

  // ─── Manejo de líneas de rango ───

  /** Crea una línea vacía para el formulario de rangos */
  lineaRangoVacia(): LineaRango {
    return { denominacion: null, numeroDel: null, numeroAl: null, error: '' };
  }

  /** Agrega una nueva línea de rango */
  agregarLineaRango(): void {
    this.lineasRango.push(this.lineaRangoVacia());
  }

  /** Elimina una línea — mínimo debe quedar 1 */
  eliminarLineaRango(index: number): void {
    if (this.lineasRango.length === 1) return;
    this.lineasRango.splice(index, 1);
  }

  /** Calcula la cantidad de cupones de una línea */
  calcularCantidadLinea(linea: LineaRango): number {
    if (linea.numeroDel != null && linea.numeroAl != null && linea.numeroAl > linea.numeroDel) {
      return linea.numeroAl - linea.numeroDel + 1;
    }
    return 0;
  }

  /** Calcula el monto de una línea */
  calcularMontoLinea(linea: LineaRango): number {
    return this.calcularCantidadLinea(linea) * (linea.denominacion ?? 0);
  }

  /** Total de cupones de todas las líneas */
  get totalCuponesCompra(): number {
    return this.lineasRango.reduce((acc, l) => acc + this.calcularCantidadLinea(l), 0);
  }

  /** Monto total de todas las líneas */
  get montoTotalCompra(): number {
    return this.lineasRango.reduce((acc, l) => acc + this.calcularMontoLinea(l), 0);
  }

  /** Cupones por denominación — para el resumen */
  cuponesporDenominacion(denom: number): number {
    return this.lineasRango
      .filter((l) => l.denominacion === denom)
      .reduce((acc, l) => acc + this.calcularCantidadLinea(l), 0);
  }

  /** Valida una línea individual y actualiza su mensaje de error */
  validarLineaRango(linea: LineaRango): boolean {
    linea.error = '';

    if (!linea.denominacion) {
      linea.error = 'Seleccione una denominación.';
      return false;
    }
    if (linea.numeroDel == null || linea.numeroDel <= 0) {
      linea.error = 'Ingrese el número inicial.';
      return false;
    }
    if (linea.numeroAl == null || linea.numeroAl <= 0) {
      linea.error = 'Ingrese el número final.';
      return false;
    }
    if (linea.numeroAl <= linea.numeroDel) {
      linea.error =
        `El número final (${linea.numeroAl}) debe ser mayor ` +
        `al número inicial (${linea.numeroDel}).`;
      return false;
    }
    return true;
  }

  /** Verifica solapamiento entre las líneas del mismo formulario */
  validarSolapamientoLineas(): string {
    for (let i = 0; i < this.lineasRango.length; i++) {
      for (let j = i + 1; j < this.lineasRango.length; j++) {
        const a = this.lineasRango[i];
        const b = this.lineasRango[j];
        // Solo comparar líneas de la misma denominación
        if (a.denominacion !== b.denominacion) continue;
        if (!a.numeroDel || !a.numeroAl || !b.numeroDel || !b.numeroAl) continue;
        // Hay solapamiento si los rangos se cruzan
        if (a.numeroDel <= b.numeroAl && a.numeroAl >= b.numeroDel) {
          return (
            `Las líneas ${i + 1} y ${j + 1} tienen rangos solapados ` + `en Q${a.denominacion}.`
          );
        }
      }
    }
    return '';
  }

  // ─── Acciones con modal ───

  /** Registrar compra de cupones con rangos */
  guardar(): void {
    // Validar encabezado
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (!this.expendedorSeleccionado) {
      this.mensajeError = 'Debe seleccionar un expendedor.';
      return;
    }

    // Validar cada línea de rango
    let hayError = false;
    for (const linea of this.lineasRango) {
      if (!this.validarLineaRango(linea)) hayError = true;
    }
    if (hayError) return;

    // Validar solapamiento entre líneas del formulario
    const errorSolape = this.validarSolapamientoLineas();
    if (errorSolape) {
      this.mensajeError = errorSolape;
      return;
    }

    // Mostrar modal de confirmación
    this.modalTitulo = 'Confirmar Registro';
    this.modalMensaje =
      `¿Confirma registrar la compra de ` +
      `<strong>${this.totalCuponesCompra}</strong> cupones ` +
      `por un total de <strong>Q${this.montoTotalCompra.toLocaleString('es-GT')}.00</strong>?`;
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

    const dto = {
      fechaCompra: v.fechaCompra,
      idExpendedor: Number(this.expendedorSeleccionado!.id),
      fechaEmision: v.fechaEmision,
      fechaVencimiento: v.fechaVencimiento,
      observaciones: v.observaciones || undefined,
      detalles: this.lineasRango.map((l) => ({
        denominacion: l.denominacion!,
        numeroDel: l.numeroDel!,
        numeroAl: l.numeroAl!,
      })),
    };

    this.cuponService.agregarCompra(dto).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.mensajeExito = `Compra #${res.idCompra} registrada correctamente.`;
        this.volverLista();
        this.cargarCompras();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar la compra.';
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
    this.modalMensaje =
      `¿Está seguro que desea trasladar el ` +
      `<strong>Talonario #${this.talonarioSeleccionado?.id}</strong> ` +
      `a <strong>${destino}</strong>?`;
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
      error: (err: any) => {
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
    this.modalMensaje =
      `¿Confirma devolver <strong>${v.cuponesRetornados}</strong> cupones ` +
      `del <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> a Bodega?`;
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
      error: (err: any) => {
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
    this.modalMensaje =
      `¿Confirma devolver <strong>${v.cuponesRetornados}</strong> cupones ` +
      `del <strong>Talonario #${this.talonarioSeleccionado?.id}</strong> a Compras?`;
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
      error: (err: any) => {
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
    this.modalMensaje =
      `¿Confirma marcar el ` +
      `<strong>Talonario #${this.talonarioSeleccionado?.id}</strong> ` +
      `como devuelto al proveedor? Esta acción es definitiva.`;
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
        error: (err: any) => {
          this.mensajeError = err.error?.mensaje || 'Error al devolver al proveedor.';
        },
      });
  }

  /** Regresar talonario a Compras */
  regresarACompras(): void {
    if (!this.talonarioSeleccionado) return;
    this.modalTitulo = 'Regresar a Compras';
    this.modalMensaje =
      `¿Está seguro que desea regresar el ` +
      `<strong>Talonario #${this.talonarioSeleccionado.id}</strong> ` +
      `a Compras? Los cupones disponibles serán devueltos.`;
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
      error: (err: any) => {
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
    if (this.esCompras || this.esAdmin) {
      this.cargarCompras();
    } else {
      this.cargarTalonarios();
    }
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

  /** Verifica si una fecha de vencimiento ya pasó */
  estaVencido(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  }

  /** Verifica si vence en los próximos 7 días */
  estaProximoVencer(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    const venc = new Date(fechaVencimiento);
    const hoy = new Date();
    const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
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
  /** Expande o colapsa el detalle de disponibles de una denominación */
  toggleDetalleDenominacion(denominacion: number): void {
    if (this.denominacionExpandida === denominacion) {
      this.denominacionExpandida = null;
      this.detalleDenominacion = [];
    } else {
      this.denominacionExpandida = denominacion;

      // Generar números individuales disponibles por rango
      const rangos = this.talonariosBodega.filter((t: any) => t.denominacion === denominacion);

      this.detalleDenominacion = rangos.map((r: any) => {
        const entregados = r.cantidad - r.disponibles;
        const primerDisp = r.numeroDel + entregados;
        const numeros: number[] = [];
        for (let i = primerDisp; i <= r.numeroAl; i++) {
          numeros.push(i);
        }
        return { ...r, numerosDisponibles: numeros };
      });
    }
    this.cdr.detectChanges();
  }
  /** Carga inventario agrupado de la sede del delegado */
  cargarInventarioDelegado(): void {
    console.log('inventarioDelegadoAgrupado:', this.inventarioDelegadoAgrupado);
    console.log('>>> EJECUTANDO cargarInventarioDelegado, idSede:', this.idSedeUsuario);
    if (!this.idSedeUsuario) {
      console.log('>>> idSedeUsuario es null, saliendo');
      return;
    }
    this.cuponService.obtenerInventarioSedeAgrupado(this.idSedeUsuario).subscribe({
      next: (data) => {
        console.log('>>> inventario delegado recibido:', data);
        this.inventarioDelegadoAgrupado = data.filter((g: any) => g.totalDisponibles > 0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('>>> error inventario delegado:', err);
      },
    });
  }

  toggleDetalleDelegado(denominacion: number): void {
    if (this.denominacionDelegadoExpandida === denominacion) {
      this.denominacionDelegadoExpandida = null;
      this.detalleDelegadoDisponibles = [];
      this.cdr.detectChanges();
      return;
    }
    this.denominacionDelegadoExpandida = denominacion;

    // Obtener rangos de la sede del delegado
    this.cuponService.obtenerInventarioSedeAgrupado(this.idSedeUsuario!).subscribe({
      next: () => {},
    });

    // Generar números disponibles desde solicitudes atendidas
    if (!this.idSedeUsuario) return;
    const params = `?idSede=${this.idSedeUsuario}&denominacion=${denominacion}`;
    // Usar el SP de rangos individuales
    this.cuponService.obtenerRangosSede(this.idSedeUsuario, denominacion).subscribe({
      next: (data: any[]) => {
        this.detalleDelegadoDisponibles = data.map((r: any) => {
          const numeros: number[] = [];
          for (let i = r.numeroDel; i <= r.numeroDel + r.cantidadDisponible - 1; i++) {
            numeros.push(i);
          }
          return { ...r, numerosDisponibles: numeros };
        });
        this.cdr.detectChanges();
      },
    });
  }
}
