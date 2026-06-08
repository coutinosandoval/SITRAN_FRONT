import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Modal reutilizable para todo el sistema SITRAN.
 * El color del header cambia según el tipo de acción.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.html',
})
export class ModalComponent {
  /** Título del modal */
  @Input() titulo: string = '';

  /** Mensaje o descripción principal */
  @Input() mensaje: string = '';

  /** Tipo de modal: confirmar | peligro | devolucion | info */
  @Input() tipo: 'confirmar' | 'peligro' | 'devolucion' | 'info' = 'confirmar';

  /** Texto del botón de acción principal */
  @Input() textoBtnAceptar: string = 'Confirmar';

  /** Muestra u oculta el modal */
  @Input() visible: boolean = false;

  /** Si necesita un textarea (ej: rechazo) */
  @Input() conTexto: boolean = false;
  @Input() placeholderTexto: string = 'Escriba aquí...';

  /** Si necesita un input numérico (ej: devolución) */
  @Input() conNumero: boolean = false;
  @Input() labelNumero: string = 'Cantidad';
  @Input() maxNumero: number = 100;
  @Input() placeholderNumero: string = '0';

  /** Valores internos */
  textoIngresado: string = '';
  numeroIngresado: number = 0;

  /** Eventos */
  @Output() aceptar = new EventEmitter<{ texto?: string; numero?: number }>();
  @Output() cancelar = new EventEmitter<void>();

  /** Color del header según tipo */
  get colorHeader(): string {
    switch (this.tipo) {
      case 'peligro':
        return '#dc3545';
      case 'devolucion':
        return '#0dcaf0';
      case 'info':
        return '#17a2b8';
      default:
        return '#007bff';
    }
  }

  /** Color del texto del header (oscuro para cyan) */
  get colorTextoHeader(): string {
    return this.tipo === 'devolucion' ? '#1f2937' : 'white';
  }

  /** Ícono según tipo */
  get icono(): string {
    switch (this.tipo) {
      case 'peligro':
        return 'ti-x';
      case 'devolucion':
        return 'ti-arrow-back-up';
      case 'info':
        return 'ti-info-circle';
      default:
        return 'ti-circle-check';
    }
  }

  /** Emite el evento de aceptar con los datos ingresados */
  onAceptar(): void {
    this.aceptar.emit({
      texto: this.conTexto ? this.textoIngresado : undefined,
      numero: this.conNumero ? this.numeroIngresado : undefined,
    });
    this.textoIngresado = '';
    this.numeroIngresado = 0;
  }

  /** Emite el evento de cancelar */
  onCancelar(): void {
    this.textoIngresado = '';
    this.numeroIngresado = 0;
    this.cancelar.emit();
  }
}
