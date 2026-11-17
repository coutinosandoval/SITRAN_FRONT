// ============================================================
// imprimir-folios.ts — Botón "Imprimir con folios" + confirmación
// Lo usan el Libro de Control Almacén y el Libro por Sedes.
// Solo se muestra a quien tiene el permiso GESTIONAR_FOLIOS.
// ============================================================
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicios/auth.service';
import { FolioService, FolioPrevista } from '../../servicios/folio.service';

@Component({
  selector: 'app-imprimir-folios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-folios.html',
})
export class ImprimirFolios {
  // ── Datos que le pasa el libro que lo contiene ───────────
  @Input() idSede: number | null = null;
  @Input() nombreSede: string = '';
  @Input() denominacion: number = 50;
  @Input() fechaIni: string = '';
  @Input() fechaFin: string = '';
  @Input() conPlacas: boolean = false;   // true en el libro por sedes

  // Avisa al libro cuando se imprimió (por si quiere refrescar algo)
  @Output() impreso = new EventEmitter<void>();

  // ── Estado del diálogo ───────────────────────────────────
  mostrarModal = false;
  consultando = false;     // calculando la vista previa
  imprimiendo = false;     // generando el Excel
  prevista: FolioPrevista | null = null;
  mensajeError = '';
  // Resultado después de imprimir
  resultado: { lote: string; folioInicial: number; folioFinal: number } | null = null;

  // Quedan pocos folios si después de imprimir sobran 20 o menos
  readonly UMBRAL_ALERTA = 20;

  constructor(
    private folioService: FolioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Solo quien gestiona folios ve el botón
  get puedeImprimir(): boolean {
    return this.authService.tienePermiso('GESTIONAR_FOLIOS');
  }

  // Folios que sobrarían después de esta impresión
  get restantes(): number | null {
    if (!this.prevista || this.prevista.disponibles == null) return null;
    return this.prevista.disponibles - this.prevista.hojas;
  }

  // ── Paso 1: calcular la vista previa y abrir el diálogo ──
  abrir(): void {
    if (!this.idSede || !this.fechaIni || !this.fechaFin) return;

    this.mostrarModal = true;
    this.consultando = true;
    this.prevista = null;
    this.resultado = null;
    this.mensajeError = '';

    this.folioService
      .prevista(this.idSede, this.denominacion, this.fechaIni, this.fechaFin)
      .subscribe({
        next: (p) => {
          this.prevista = p;
          this.consultando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.mensajeError = 'No se pudo calcular la vista previa de folios.';
          this.consultando = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Paso 2: confirmar → reserva folios y descarga el Excel ──
  confirmar(): void {
    if (!this.idSede || !this.prevista?.valido) return;

    this.imprimiendo = true;
    this.mensajeError = '';

    this.folioService
      .imprimir({
        idSede: this.idSede,
        denominacion: this.denominacion,
        fechaIni: this.fechaIni,
        fechaFin: this.fechaFin,
        nombreSede: this.nombreSede || null,
        conPlacas: this.conPlacas,
      })
      .subscribe({
        next: (resp) => {
          const ini = this.prevista!.folioInicial!;
          const fin = this.prevista!.folioFinal!;
          // Se descarga el Excel con los folios en el nombre
          this.folioService.descargar(
            resp.body!,
            `LibroControl_Q${this.denominacion}_Folios${ini}-${fin}.xlsx`,
          );
          this.resultado = {
            lote: resp.headers.get('X-Folio-Lote') ?? '',
            folioInicial: ini,
            folioFinal: fin,
          };
          this.imprimiendo = false;
          this.impreso.emit();
          this.cdr.detectChanges();
        },
        error: async (err) => {
          this.mensajeError = await this.folioService.leerMensajeError(
            err,
            'No se pudo imprimir el libro.',
          );
          this.imprimiendo = false;
          this.cdr.detectChanges();
        },
      });
  }

  cerrar(): void {
    if (this.imprimiendo) return;   // no se cierra mientras genera
    this.mostrarModal = false;
  }
}