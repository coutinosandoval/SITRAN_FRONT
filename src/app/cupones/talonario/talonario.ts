import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuponService } from '../../servicios/cupon.service';
import { Talonario, TalonarioRequest, TalonarioTrasladar, TalonarioDevolver, BitacoraTalonario } from '../../modelos/cupon.model';
import { CatalogoItem } from '../../modelos/vehiculo.model';

@Component({
  selector: 'app-talonario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './talonario.html'
})
export class TalonarioComponent implements OnInit {

  talonarios:     Talonario[] = [];
  paginaActual:   number = 1;
  tamanioPagina:  number = 10;
  totalRegistros: number = 0;
  totalPaginas:   number = 0;
  filtroEstado:   number = 0;
  sedes:          CatalogoItem[] = [];
  expendedores:   CatalogoItem[] = [];
  busquedaExpendedor:     string         = '';
  expendedoresFiltrados:  CatalogoItem[] = [];
  mostrarDropdown:        boolean        = false;
  expendedorSeleccionado: CatalogoItem | null = null;
  mostrarLista:      boolean = true;
  mostrarFormulario: boolean = false;
  mostrarDetalle:    boolean = false;
  mostrarTraslado:   boolean = false;
  mostrarDevolucion: boolean = false;
  talonarioSeleccionado: Talonario | null = null;
  bitacora: BitacoraTalonario[] = [];

  estados = [
    { id: 0, nombre: 'Todos'      },
    { id: 1, nombre: 'Disponible' },
    { id: 2, nombre: 'Asignado'   },
    { id: 3, nombre: 'Entregado'  },
    { id: 4, nombre: 'Devuelto'   },
    { id: 5, nombre: 'Vencido'    },
  ];

  valores = [50, 100];

  formulario:         FormGroup;
  formularioTraslado: FormGroup;
  formularioDevolver: FormGroup;

  mensajeExito: string  = '';
  mensajeError: string  = '';
  cargando:     boolean = false;

  constructor(
    private cuponService: CuponService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formulario = this.fb.group({
      fechaCompra:      ['', Validators.required],
      idExpendedor:     ['', Validators.required],
      cantidadCupones:  ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      valorCupon:       [100, Validators.required],
      fechaEmision:     ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      numeradoDel:      ['', Validators.required],
      numeradoAl:       ['', Validators.required],
      observaciones:    [''],
    });

    this.formularioTraslado = this.fb.group({
      idSedeTraslado: ['', Validators.required],
      fechaTraslado:  ['', Validators.required],
      trasladadoPor:  ['', Validators.required],
      retornadoPor:   ['', Validators.required],
    });

    this.formularioDevolver = this.fb.group({
      cuponesRetornados: ['', [Validators.required, Validators.min(1)]],
      fechaRetorno:      ['', Validators.required],
      retornadoPor:      ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarTalonarios();
    this.cargarSedes();
    this.cargarExpendedores();
  }

  cargarTalonarios(): void {
    this.cargando = true;
    this.cuponService.obtenerTalonarios(
      this.paginaActual,
      this.tamanioPagina,
      this.filtroEstado || undefined
    ).subscribe({
      next: (data) => {
        this.talonarios     = [...data.talonarios];
        this.totalRegistros = data.totalRegistros;
        this.totalPaginas   = data.totalPaginas;
        this.cargando       = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar talonarios.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarSedes(): void {
    this.cuponService.obtenerSedes()
      .subscribe({ next: (data) => this.sedes = data });
  }

  cargarExpendedores(): void {
    this.cuponService.obtenerExpendedores()
      .subscribe({ next: (data) => this.expendedores = data });
  }

  cargarBitacora(idTalonario: number): void {
    this.bitacora = [];
    this.cuponService.obtenerBitacora(idTalonario)
      .subscribe({
        next: (data) => {
          this.bitacora = data;
          this.cdr.detectChanges();
        }
      });
  }

  filtrarExpendedores(): void {
    const texto = this.busquedaExpendedor.toLowerCase();
    this.expendedoresFiltrados = this.expendedores.filter(e =>
      e.nombre.toLowerCase().includes(texto)
    );
    this.mostrarDropdown = this.expendedoresFiltrados.length > 0 && texto.length > 0;
  }

  seleccionarExpendedor(e: CatalogoItem): void {
    this.expendedorSeleccionado = e;
    this.busquedaExpendedor     = e.nombre;
    this.mostrarDropdown        = false;
    this.formulario.patchValue({ idExpendedor: e.id });
  }

  limpiarExpendedor(): void {
    this.expendedorSeleccionado = null;
    this.busquedaExpendedor     = '';
    this.mostrarDropdown        = false;
    this.formulario.patchValue({ idExpendedor: '' });
  }

  filtrar(): void {
    this.paginaActual = 1;
    this.cargarTalonarios();
  }

  mostrarAgregar(): void {
    this.mostrarLista           = false;
    this.mostrarFormulario      = true;
    this.mostrarDetalle         = false;
    this.mostrarTraslado        = false;
    this.mostrarDevolucion      = false;
    this.expendedorSeleccionado = null;
    this.busquedaExpendedor     = '';
    this.mostrarDropdown        = false;
    this.formulario.reset({ cantidadCupones: '', valorCupon: 100 });
    this.limpiarMensajes();
  }

  verDetalle(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = true;
    this.mostrarTraslado       = false;
    this.mostrarDevolucion     = false;
    this.cargarBitacora(t.id);
  }

  abrirTraslado(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = false;
    this.mostrarTraslado       = true;
    this.mostrarDevolucion     = false;
    this.formularioTraslado.reset();
    this.limpiarMensajes();
  }

  abrirDevolucion(t: Talonario): void {
    this.talonarioSeleccionado = t;
    this.mostrarLista          = false;
    this.mostrarFormulario     = false;
    this.mostrarDetalle        = false;
    this.mostrarTraslado       = false;
    this.mostrarDevolucion     = true;
    this.formularioDevolver.reset();
    this.limpiarMensajes();
  }

  volverLista(): void {
    this.mostrarLista      = true;
    this.mostrarFormulario = false;
    this.mostrarDetalle    = false;
    this.mostrarTraslado   = false;
    this.mostrarDevolucion = false;
    this.limpiarMensajes();
  }

  calcularNumeradoAl(): void {
    const del      = this.formulario.get('numeradoDel')?.value;
    const cantidad = this.formulario.get('cantidadCupones')?.value;
    if (del && cantidad && cantidad > 0 && cantidad <= 100) {
      this.formulario.patchValue({ numeradoAl: Number(del) + Number(cantidad) - 1 });
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (!this.expendedorSeleccionado) {
      this.mensajeError = 'Debe seleccionar un expendedor.';
      return;
    }
    if (!confirm('¿Está seguro que desea registrar este talonario?')) return;

    this.cargando = true;
    const v = this.formulario.value;

    const dto: TalonarioRequest = {
      fechaCompra:      v.fechaCompra      || undefined,
      idExpendedor:     Number(v.idExpendedor),
      cantidadCupones:  Number(v.cantidadCupones),
      valorCupon:       Number(v.valorCupon),
      fechaEmision:     v.fechaEmision     || undefined,
      fechaVencimiento: v.fechaVencimiento || undefined,
      numeradoDel:      Number(v.numeradoDel),
      numeradoAl:       Number(v.numeradoAl),
      observaciones:    v.observaciones    || undefined,
      idComprador:      0,
    };

    this.cuponService.agregarTalonario(dto).subscribe({
      next: () => {
        this.cargando = false;
        alert('Talonario registrado correctamente con sus cupones.');
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al registrar el talonario.';
        this.cargando     = false;
      }
    });
  }

  guardarTraslado(): void {
    if (this.formularioTraslado.invalid) {
      this.formularioTraslado.markAllAsTouched();
      return;
    }
    if (!confirm('¿Está seguro que desea trasladar este talonario?')) return;

    const v = this.formularioTraslado.value;
    const dto: TalonarioTrasladar = {
      idSedeTraslado: Number(v.idSedeTraslado),
      fechaTraslado:  v.fechaTraslado || undefined,
      trasladadoPor:  v.trasladadoPor,
      retornadoPor:   v.retornadoPor,
    };

    this.cuponService.trasladarTalonario(this.talonarioSeleccionado!.id, dto).subscribe({
      next: () => {
        alert('Talonario trasladado correctamente.');
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al trasladar el talonario.';
      }
    });
  }

  guardarDevolucion(): void {
    if (this.formularioDevolver.invalid) {
      this.formularioDevolver.markAllAsTouched();
      return;
    }
    if (!confirm('¿Está seguro que desea devolver este talonario?')) return;

    const v = this.formularioDevolver.value;
    const dto: TalonarioDevolver = {
      cuponesRetornados: Number(v.cuponesRetornados),
      fechaRetorno:      v.fechaRetorno || undefined,
      retornadoPor:      v.retornadoPor,
    };

    this.cuponService.devolverTalonario(this.talonarioSeleccionado!.id, dto).subscribe({
      next: () => {
        alert('Talonario devuelto correctamente.');
        this.volverLista();
        this.cargarTalonarios();
      },
      error: (err) => {
        this.mensajeError = err.error?.mensaje || 'Error al devolver el talonario.';
      }
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarTalonarios();
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

  colorEstado(estado: number): string {
    switch (estado) {
      case 1: return 'bg-success';
      case 2: return 'bg-primary';
      case 3: return 'bg-warning text-dark';
      case 4: return 'bg-secondary';
      case 5: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  colorMovimiento(tipo?: string): string {
    switch (tipo) {
      case 'COMPRA':     return 'bg-success';
      case 'TRASLADO':   return 'bg-primary';
      case 'DEVOLUCION': return 'bg-warning text-dark';
      default:           return 'bg-secondary';
    }
  }

  iconoMovimiento(tipo?: string): string {
    switch (tipo) {
      case 'COMPRA':     return 'bi-cart-check';
      case 'TRASLADO':   return 'bi-arrow-right-circle';
      case 'DEVOLUCION': return 'bi-arrow-return-left';
      default:           return 'bi-circle';
    }
  }
}