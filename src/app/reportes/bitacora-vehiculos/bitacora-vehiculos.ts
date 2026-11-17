import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../servicios/reporte.service';
import { VehiculoService } from '../../servicios/vehiculo.service';
import { BitacoraVehiculo, FiltroBitacoraVehiculos } from '../../modelos/bitacora-vehiculo.model';
import { CatalogoItem, Vehiculo } from '../../modelos/vehiculo.model';

@Component({
  selector: 'app-reporte-bitacora-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora-vehiculos.html'
})
export class BitacoraVehiculosComponent implements OnInit {

  // Datos del reporte
  registros: BitacoraVehiculo[] = [];

  // Catálogos para los filtros
  vehiculos: Vehiculo[] = [];
  sedes: CatalogoItem[] = [];

  // Filtros seleccionados
  filtro: FiltroBitacoraVehiculos = {};

  // Control de vista
  cargando: boolean = false;
  exportando: boolean = false;
  mensajeError: string = '';

  constructor(
    private reporteService: ReporteService,
    private vehiculoService: VehiculoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.buscar();
  }

  // Carga catálogos de vehículos y sedes para los filtros
  cargarCatalogos(): void {
    // Cargamos hasta 1000 vehículos para el selector de filtro
    this.vehiculoService.obtener(1, 1000).subscribe({
      next: (data) => {
        this.vehiculos = data.vehiculos;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error al cargar vehículos')
    });

    this.vehiculoService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.sedes = data.sedes;
        this.cdr.detectChanges();
      },
      error: () => console.error('Error al cargar sedes')
    });
  }

  // Ejecuta la búsqueda del reporte con los filtros actuales
  buscar(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.reporteService.obtenerBitacoraVehiculos(this.filtro).subscribe({
      next: (data) => {
        this.registros = data;
        this.cargando  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'Error al cargar el reporte.';
        this.cargando     = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Limpia los filtros y vuelve a buscar
  limpiarFiltros(): void {
    this.filtro = {};
    this.buscar();
  }

  // Descarga un archivo a partir de un Blob
  private descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Exporta el reporte a Excel
  exportarExcel(): void {
    this.exportando = true;
    this.reporteService.exportarExcel(this.filtro).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `BitacoraVehiculos_${this.fechaActual()}.xlsx`);
        this.exportando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error al generar el archivo Excel.');
        this.exportando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Exporta el reporte a PDF
  exportarPdf(): void {
    this.exportando = true;
    this.reporteService.exportarPdf(this.filtro).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `BitacoraVehiculos_${this.fechaActual()}.pdf`);
        this.exportando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error al generar el archivo PDF.');
        this.exportando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Exporta el reporte a Word
  exportarWord(): void {
    this.exportando = true;
    this.reporteService.exportarWord(this.filtro).subscribe({
      next: (blob) => {
        this.descargarArchivo(blob, `BitacoraVehiculos_${this.fechaActual()}.docx`);
        this.exportando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error al generar el archivo Word.');
        this.exportando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Devuelve la fecha actual en formato YYYYMMDD_HHmmss para nombres de archivo
  private fechaActual(): string {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}_${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}`;
  }
}