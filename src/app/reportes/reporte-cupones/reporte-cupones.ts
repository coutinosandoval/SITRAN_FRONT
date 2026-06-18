import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../servicios/reporte.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-reporte-cupones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-cupones.html',
})
export class ReporteCuponesComponent implements OnInit {
  // ─── Filtros ───
  idSede: number = 0;
  fechaInicio: string = '';
  fechaFin: string = '';
  denominacion: number = 100;

  // ─── Estado ───
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  // ─── Catálogos ───
  denominaciones = [
    { valor: 100, label: 'Q 100.00' },
    { valor: 50, label: 'Q 50.00' },
  ];

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Pre-cargar la sede del usuario si es Delegado
    const idUnidad = this.authService.obtenerIdUnidad();
    if (idUnidad) this.idSede = idUnidad;

    // Fecha por defecto: mes actual
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  // Descarga el Excel del Libro de Control
  descargarLibroControl(): void {
    if (!this.idSede) {
      this.mensajeError = 'Debe ingresar un ID de sede.';
      return;
    }
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Debe seleccionar el rango de fechas.';
      return;
    }
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) {
      this.mensajeError = 'La fecha de inicio no puede ser mayor a la fecha fin.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.reporteService
      .descargarLibroControlCupones(this.idSede, this.fechaInicio, this.fechaFin, this.denominacion)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `LibroControlCupones_Sede${this.idSede}_${this.fechaInicio.substring(0, 7)}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.mensajeExito = 'Reporte generado correctamente.';
          this.cargando = false;
        },
        error: (err) => {
          this.mensajeError = err.error?.mensaje || 'Error al generar el reporte.';
          this.cargando = false;
        },
      });
  }

  limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
