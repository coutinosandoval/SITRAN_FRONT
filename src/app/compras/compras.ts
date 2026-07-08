// ============================================================
// compras.component.ts — Módulo de compra de cupones
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../servicios/compras.service';
import { Compra, CompraDetalle, ComprasPaginadas } from '../modelos/compra.model';
import { AuthService } from '../servicios/auth.service';

/** Línea temporal del formulario antes de enviar */
interface LineaFormulario {
  denominacion: number | null;
  numeroDel: number | null;
  numeroAl: number | null;
  error?: string; // error de validación de esta línea
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.html',
})
export class ComprasComponent implements OnInit {
  // ── Lista de compras ─────────────────────────────────────
  compras: Compra[] = [];
  total: number = 0;
  pagina: number = 1;
  porPagina: number = 10;
  cargando: boolean = false;

  // ── Detalle de una compra seleccionada ───────────────────
  compraSeleccionada: Compra | null = null;
  detalleRangos: CompraDetalle[] = [];
  cargandoDetalle: boolean = false;

  // ── Formulario de nueva compra ───────────────────────────
  mostrarFormulario: boolean = false;
  guardando: boolean = false;
  errorGeneral: string = '';
  exitoMensaje: string = '';

  // Campos del encabezado
  fechaCompra: string = '';
  idExpendedor: number | null = null;
  fechaEmision: string = '';
  fechaVencimiento: string = '';
  observaciones: string = '';

  // Catálogo de expendedores
  expendedores: { id: number; nombre: string }[] = [];

  // Líneas del formulario (rangos)
  lineas: LineaFormulario[] = [];

  // Denominaciones disponibles
  readonly denominaciones = [
    { valor: 50, etiqueta: 'Q 50.00' },
    { valor: 100, etiqueta: 'Q 100.00' },
  ];

  // Permisos
  esCompras: boolean = false;

  constructor(
    private comprasService: ComprasService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Verificar permiso
    this.esCompras = this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.cargarCompras();
    this.cargarExpendedores();
  }

  // ── Cargar lista ─────────────────────────────────────────
  cargarCompras(): void {
    this.cargando = true;
    this.comprasService.obtenerCompras(this.pagina, this.porPagina).subscribe({
      next: (res: ComprasPaginadas) => {
        this.compras = res.datos;
        this.total = res.total;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  cargarExpendedores(): void {
    // TODO: conectar al endpoint de catálogo de expendedores
    // this.catalogoService.obtenerExpendedores().subscribe(...)
  }

  // ── Paginación ───────────────────────────────────────────
  get totalPaginas(): number {
    return Math.ceil(this.total / this.porPagina);
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.pagina = p;
    this.cargarCompras();
  }

  // ── Ver detalle de una compra ────────────────────────────
  verDetalle(compra: Compra): void {
    this.compraSeleccionada = compra;
    this.cargandoDetalle = true;
    this.detalleRangos = [];

    this.comprasService.obtenerDetalle(compra.id!).subscribe({
      next: (rangos: CompraDetalle[]) => {
        this.detalleRangos = rangos;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
      },
    });
  }

  cerrarDetalle(): void {
    this.compraSeleccionada = null;
    this.detalleRangos = [];
  }

  // ── Formulario nueva compra ──────────────────────────────
  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.errorGeneral = '';
    this.exitoMensaje = '';
    this.fechaCompra = new Date().toISOString().substring(0, 10);
    this.idExpendedor = null;
    this.fechaEmision = '';
    this.fechaVencimiento = '';
    this.observaciones = '';
    // Inicia con una línea vacía
    this.lineas = [this.lineaVacia()];
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.lineas = [];
    this.errorGeneral = '';
  }

  lineaVacia(): LineaFormulario {
    return { denominacion: null, numeroDel: null, numeroAl: null, error: '' };
  }

  /** Agrega una línea nueva al formulario */
  agregarLinea(): void {
    this.lineas.push(this.lineaVacia());
  }

  /** Elimina una línea del formulario */
  eliminarLinea(index: number): void {
    if (this.lineas.length === 1) return; // siempre debe haber al menos 1
    this.lineas.splice(index, 1);
  }

  /** Calcula la cantidad de cupones de una línea */
  calcularCantidad(linea: LineaFormulario): number {
    if (linea.numeroDel != null && linea.numeroAl != null && linea.numeroAl > linea.numeroDel) {
      return linea.numeroAl - linea.numeroDel + 1;
    }
    return 0;
  }

  /** Calcula el monto de una línea */
  calcularMontoLinea(linea: LineaFormulario): number {
    return this.calcularCantidad(linea) * (linea.denominacion ?? 0);
  }

  /** Total de cupones del formulario completo */
  get totalCuponesFormulario(): number {
    return this.lineas.reduce((acc, l) => acc + this.calcularCantidad(l), 0);
  }

  /** Monto total del formulario completo */
  get montoTotalFormulario(): number {
    return this.lineas.reduce((acc, l) => acc + this.calcularMontoLinea(l), 0);
  }

  /** Valida una línea y actualiza su mensaje de error */
  validarLinea(linea: LineaFormulario): boolean {
    linea.error = '';

    if (!linea.denominacion) {
      linea.error = 'Seleccione una denominación.';
      return false;
    }
    if (linea.numeroDel == null || linea.numeroDel <= 0) {
      linea.error = 'Ingrese el número inicial del rango.';
      return false;
    }
    if (linea.numeroAl == null || linea.numeroAl <= 0) {
      linea.error = 'Ingrese el número final del rango.';
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

  /** Valida solapamiento entre las líneas del mismo formulario */
  validarSolapamientoInterno(): string {
    for (let i = 0; i < this.lineas.length; i++) {
      for (let j = i + 1; j < this.lineas.length; j++) {
        const a = this.lineas[i];
        const b = this.lineas[j];
        // Solo comparar líneas de la misma denominación
        if (a.denominacion !== b.denominacion) continue;
        if (a.numeroDel == null || a.numeroAl == null) continue;
        if (b.numeroDel == null || b.numeroAl == null) continue;
        // Verificar solapamiento
        if (a.numeroDel <= b.numeroAl! && a.numeroAl >= b.numeroDel!) {
          return (
            `Las líneas ${i + 1} y ${j + 1} tienen rangos solapados ` +
            `en la denominación Q${a.denominacion}.`
          );
        }
      }
    }
    return '';
  }

  /** Guarda la compra */
  guardarCompra(): void {
    this.errorGeneral = '';
    this.exitoMensaje = '';

    // Validar encabezado
    if (!this.fechaCompra) {
      this.errorGeneral = 'La fecha de compra es obligatoria.';
      return;
    }
    if (!this.idExpendedor) {
      this.errorGeneral = 'Seleccione un expendedor.';
      return;
    }
    if (!this.fechaEmision) {
      this.errorGeneral = 'La fecha de emisión es obligatoria.';
      return;
    }
    if (!this.fechaVencimiento) {
      this.errorGeneral = 'La fecha de vencimiento es obligatoria.';
      return;
    }
    if (this.fechaVencimiento <= this.fechaEmision) {
      this.errorGeneral = 'La fecha de vencimiento debe ser mayor a la fecha de emisión.';
      return;
    }

    // Validar cada línea
    let hayErrorLinea = false;
    for (const linea of this.lineas) {
      if (!this.validarLinea(linea)) hayErrorLinea = true;
    }
    if (hayErrorLinea) return;

    // Validar solapamiento entre líneas del formulario
    const errorSolapamiento = this.validarSolapamientoInterno();
    if (errorSolapamiento) {
      this.errorGeneral = errorSolapamiento;
      return;
    }

    this.guardando = true;

    const dto = {
      fechaCompra: this.fechaCompra,
      idExpendedor: this.idExpendedor!,
      fechaEmision: this.fechaEmision,
      fechaVencimiento: this.fechaVencimiento,
      observaciones: this.observaciones || undefined,
      detalles: this.lineas.map((l) => ({
        denominacion: l.denominacion!,
        numeroDel: l.numeroDel!,
        numeroAl: l.numeroAl!,
      })),
    };

    this.comprasService.agregarCompra(dto).subscribe({
      next: (res: { idCompra: number; mensaje: string }) => {
        this.guardando = false;
        this.exitoMensaje = `Compra #${res.idCompra} registrada correctamente.`;
        this.cerrarFormulario();
        this.cargarCompras();
      },
      error: (err: any) => {
        this.guardando = false;
        this.errorGeneral = err?.error?.mensaje || 'Error al registrar la compra.';
      },
    });
  }

  // ── Helpers de presentación ──────────────────────────────
  formatoQuetzales(monto: number): string {
    return `Q ${monto.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-GT');
  }
}
