import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../servicios/reporte.service';
import { AuthService } from '../../servicios/auth.service';
import { SedeService, Sede } from '../../servicios/sede.service';

@Component({
  selector: 'app-reporte-cupones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-cupones.html',
})
export class ReporteCuponesComponent implements OnInit {
  // ─── Filtros ───
  idSede: number = 0;
  nombreSedeBusqueda: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  denominacion: number = 100;
  fechaMaxima: string = '';

  // ─── Autocompletado de sede ───
  sedes: Sede[] = [];
  sedesFiltradas: Sede[] = [];
  mostrarSugerencias: boolean = false;

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
    private sedeService: SedeService,
  ) {}

  ngOnInit(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes = data;
      },
    });

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = primerDia.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  buscarSede(): void {
    const texto = this.nombreSedeBusqueda.trim().toUpperCase();
    if (!texto) {
      this.sedesFiltradas = [];
      this.mostrarSugerencias = false;
      this.idSede = 0;
      return;
    }
    this.sedesFiltradas = this.sedes.filter((s) => s.nombre.toUpperCase().includes(texto));
    this.mostrarSugerencias = this.sedesFiltradas.length > 0;
  }

  seleccionarSede(sede: Sede): void {
    this.idSede = sede.id;
    this.nombreSedeBusqueda = sede.nombre;
    this.mostrarSugerencias = false;
  }

  ocultarSugerencias(): void {
    setTimeout(() => (this.mostrarSugerencias = false), 200);
  }

  descargarLibroControl(): void {
    if (!this.formularioValido) return;

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

  

  // Determina si el formulario está completo y válido para habilitar el botón
  get formularioValido(): boolean {
    if (!this.idSede) return false;
    if (!this.denominacion) return false;
    if (!this.fechaInicio || !this.fechaFin) return false;
    if (new Date(this.fechaInicio) > new Date(this.fechaFin)) return false;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (new Date(this.fechaFin) > hoy) return false;

    return true;
  }

  limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }
}
