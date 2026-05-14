import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../servicios/dashboard.service';
import { DashboardResumen, PrecioCombustible } from '../modelos/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {

  // ─── Datos ───
  resumen:                 DashboardResumen | null = null;
  precios:                 PrecioCombustible[]     = [];
  preciosAutoservicio:     PrecioCombustible[]     = [];
  preciosServicioCompleto: PrecioCombustible[]     = [];
  cargando:                boolean                 = true;

  constructor(
    private dashboardService: DashboardService,
    private cdr:              ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar resumen de estadísticas
    this.dashboardService.getResumen().subscribe({
      next: (data) => {
        this.resumen  = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // Cargar precios de combustible del MEM
    this.dashboardService.getPreciosCombustible().subscribe({
      next: (data) => {
        this.precios                 = data;
        this.preciosAutoservicio     = data.filter(p => p.tipoServicio === 'Autoservicio');
        this.preciosServicioCompleto = data.filter(p => p.tipoServicio === 'Servicio Completo');
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }
}