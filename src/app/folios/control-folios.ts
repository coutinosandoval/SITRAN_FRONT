// ============================================================
// control-folios.ts — Pantalla de Control de Folios
// Rango autorizado por sede, historial de impresiones,
// reimprimir (mismos folios), anular lote y cerrar rango.
// Permiso requerido: GESTIONAR_FOLIOS
// ============================================================
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../servicios/auth.service';
import { SedeService, Sede } from '../servicios/sede.service';
import { FolioService, FolioRango, FolioHistorial } from '../servicios/folio.service';
import { ModalComponent } from '../shared/modal/modal';

@Component({
  selector: 'app-control-folios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './control-folios.html',
})
export class ControlFolios implements OnInit {
  // Sede del almacén (Bodega Central): su libro no lleva placas
  readonly ID_SEDE_ALMACEN = 41;
  // Se avisa cuando quedan 20 folios o menos
  readonly UMBRAL_ALERTA = 20;

  // ── Sede ─────────────────────────────────────────────────
  // esAdmin: elige cualquier sede. Los demás roles ven solo la suya.
  esAdmin: boolean = false;
  idSedeUsuario: number | null = null;
  sedes: Sede[] = [];
  idSede: number | null = null;

  // ── Datos ────────────────────────────────────────────────
  rango: FolioRango | null = null;
  historial: FolioHistorial[] = [];

  // ── Estado ───────────────────────────────────────────────
  cargandoRango: boolean = false;
  cargandoHistorial: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // ── Formulario de nuevo rango ────────────────────────────
  mostrarFormRango: boolean = false;
  formulario: FormGroup;

  // ── Modal de confirmación (el compartido) ────────────────
  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalTipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';
  modalBtnAceptar: string = 'Confirmar';
  modalAccion: (() => void) | null = null;

  // ── Ventana de motivo (reimprimir / anular) ──────────────
  motivoVisible: boolean = false;
  motivoAccion: 'reimprimir' | 'anular' = 'reimprimir';
  motivoTexto: string = '';
  loteSeleccionado: FolioHistorial | null = null;
  procesando: boolean = false;
  errorMotivo: string = '';

  constructor(
    private folioService: FolioService,
    private authService: AuthService,
    private sedeService: SedeService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    // Formulario del rango: el oficio o resolución es opcional
    this.formulario = this.fb.group({
      referencia: ['', [Validators.maxLength(200)]],
      folioInicial: ['', [Validators.required, Validators.min(1)]],
      folioFinal: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.esAdmin =
      this.authService.tienePermiso('VER_REPORTES_GENERALES') ||
      this.authService.tienePermiso('GESTIONAR_COMPRAS_TALONARIOS');
    this.idSedeUsuario = this.authService.obtenerIdSede();

    this.sedeService.obtenerSedes().subscribe({
      next: (data) => {
        if (this.esAdmin) {
          // El administrador elige sede; se omite "Compras – Sede Central"
          this.sedes = data.filter((s) => {
            const n = s.nombre.toUpperCase();
            return !(n.includes('COMPRAS') && n.includes('SEDE CENTRAL'));
          });
        } else {
          // Los demás roles: sede fija, la del usuario
          this.sedes = data.filter((s) => s.id === this.idSedeUsuario);
          this.idSede = this.idSedeUsuario;
          this.cargarTodo();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar las sedes.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Getters de apoyo ─────────────────────────────────────
  // Nombre de la sede seleccionada
  get nombreSede(): string {
    return this.sedes.find((s) => s.id === this.idSede)?.nombre ?? '';
  }

  // Porcentaje del rango ya utilizado (para la barra)
  get porcentajeUsado(): number {
    if (!this.rango) return 0;
    const total = this.rango.folioFinal - this.rango.folioInicial + 1;
    const usados = this.rango.folioActual - this.rango.folioInicial;
    return total > 0 ? Math.round((usados / total) * 100) : 0;
  }

  // ── Cambio de sede (solo administradores) ────────────────
  onSedeChange(): void {
    this.rango = null;
    this.historial = [];
    this.mostrarFormRango = false;
    this.limpiarMensajes();
    if (this.idSede) this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargarRango();
    this.cargarHistorial();
  }

  cargarRango(): void {
    if (!this.idSede) return;
    this.cargandoRango = true;
    this.folioService.obtenerRangoActivo(this.idSede).subscribe({
      next: (r) => {
        this.rango = r ?? null;   // sin rango activo el API responde 204 (sin cuerpo)
        this.cargandoRango = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el rango de folios.';
        this.cargandoRango = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarHistorial(): void {
    if (!this.idSede) return;
    this.cargandoHistorial = true;
    this.folioService.historial(this.idSede).subscribe({
      next: (data) => {
        this.historial = [...data];
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el historial.';
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Registrar rango nuevo ────────────────────────────────
  mostrarRegistrar(): void {
    this.limpiarMensajes();
    this.formulario.reset({ referencia: '', folioInicial: '', folioFinal: '' });
    this.mostrarFormRango = true;
  }

  cancelarRegistro(): void {
    this.mostrarFormRango = false;
  }

  guardarRango(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.value;
    const inicial = Number(v.folioInicial);
    const final = Number(v.folioFinal);

    if (final < inicial) {
      this.mensajeError = 'El folio final no puede ser menor que el inicial.';
      return;
    }
    this.mensajeError = '';

    // Confirmación con el modal compartido
    this.modalTitulo = 'Registrar rango de folios';
    this.modalMensaje = `¿Registrar los folios ${inicial} al ${final} para ${this.nombreSede}?`;
    this.modalTipo = 'confirmar';
    this.modalBtnAceptar = 'Registrar';
    this.modalAccion = () => {
      this.guardando = true;
      this.folioService
        .registrarRango({
          idSede: this.idSede!,
          referencia: v.referencia?.trim() || null,
          folioInicial: inicial,
          folioFinal: final,
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarFormRango = false;
            this.mensajeExito = 'Rango de folios registrado correctamente.';
            this.cargarRango();
          },
          error: (err) => {
            this.guardando = false;
            this.mensajeError = err.error?.mensaje || 'Error al registrar el rango.';
            this.cdr.detectChanges();
          },
        });
    };
    this.modalVisible = true;
  }

  // ── Cerrar el rango activo ───────────────────────────────
  cerrarRango(): void {
    if (!this.idSede || !this.rango) return;
    this.modalTitulo = 'Cerrar rango de folios';
    this.modalMensaje =
      `¿Cerrar el rango ${this.rango.folioInicial} al ${this.rango.folioFinal}? ` +
      `Los ${this.rango.disponibles} folios no usados ya no se podrán utilizar.`;
    this.modalTipo = 'peligro';
    this.modalBtnAceptar = 'Cerrar rango';
    this.modalAccion = () => {
      this.folioService.cerrarRango(this.idSede!).subscribe({
        next: () => {
          this.mensajeExito = 'Rango cerrado correctamente.';
          this.cargarRango();
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al cerrar el rango.';
          this.cdr.detectChanges();
        },
      });
    };
    this.modalVisible = true;
  }

  // ── Reimprimir / Anular (piden motivo) ───────────────────
  abrirMotivo(lote: FolioHistorial, accion: 'reimprimir' | 'anular'): void {
    this.limpiarMensajes();
    this.loteSeleccionado = lote;
    this.motivoAccion = accion;
    this.motivoTexto = '';
    this.errorMotivo = '';
    this.motivoVisible = true;
  }

  cancelarMotivo(): void {
    if (this.procesando) return;
    this.motivoVisible = false;
    this.loteSeleccionado = null;
  }

  confirmarMotivo(): void {
    const motivo = this.motivoTexto.trim();
    if (motivo.length < 5) {
      this.errorMotivo = 'Debe indicar el motivo (mínimo 5 caracteres).';
      return;
    }
    if (!this.loteSeleccionado) return;

    this.procesando = true;
    this.errorMotivo = '';
    const lote = this.loteSeleccionado;

    if (this.motivoAccion === 'anular') {
      this.folioService.anular(lote.lote, motivo).subscribe({
        next: () => {
          this.procesando = false;
          this.motivoVisible = false;
          this.mensajeExito =
            `Lote ${lote.lote} anulado. Los folios ${lote.folioInicial} al ${lote.folioFinal} ` +
            'no se reutilizan; las fechas quedan libres para imprimir de nuevo.';
          this.cargarHistorial();
        },
        error: (err) => {
          this.procesando = false;
          this.errorMotivo = err.error?.mensaje || 'Error al anular el lote.';
          this.cdr.detectChanges();
        },
      });
    } else {
      // Reimprimir: mismos folios; el libro de Almacén no lleva placas
      const conPlacas = this.idSede !== this.ID_SEDE_ALMACEN;
      this.folioService.reimprimir(lote.lote, motivo, this.nombreSede || null, conPlacas).subscribe({
        next: (resp) => {
          this.folioService.descargar(
            resp.body!,
            `LibroControl_Q${lote.denominacion}_Folios${lote.folioInicial}-${lote.folioFinal}_REIMPRESION.xlsx`,
          );
          this.procesando = false;
          this.motivoVisible = false;
          this.mensajeExito = `Reimpresión del lote ${lote.lote} generada con los mismos folios.`;
          this.cargarHistorial();
        },
        error: async (err) => {
          this.procesando = false;
          this.errorMotivo = await this.folioService.leerMensajeError(
            err,
            'Error al reimprimir el lote.',
          );
          this.cdr.detectChanges();
        },
      });
    }
  }

  // ── Modal compartido ─────────────────────────────────────
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

  // ── Utilidades ───────────────────────────────────────────
  tieneError(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // Fechas del API ("yyyy-MM-ddTHH:mm:ss") a dd/MM/yyyy sin conversiones de zona horaria
  formatoFecha(f: string | null): string {
    if (!f) return '—';
    const s = String(f);
    return `${s.substring(8, 10)}/${s.substring(5, 7)}/${s.substring(0, 4)}`;
  }

  formatoFechaHora(f: string | null): string {
    if (!f) return '—';
    const s = String(f);
    return `${this.formatoFecha(s)} ${s.substring(11, 16)}`;
  }
}