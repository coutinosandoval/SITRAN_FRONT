import { Component, OnInit } from '@angular/core';
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
  resumen: DashboardResumen | null = null;
  precios: PrecioCombustible[] = [];
  preciosAutoservicio: PrecioCombustible[] = [];
  preciosServicioCompleto: PrecioCombustible[] = [];
  cargando = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.dashboardService.getResumen().subscribe({
      next: (data) => this.resumen = data,
      error: (err) => console.error('Error al cargar resumen', err)
    });

    this.dashboardService.getPreciosCombustible().subscribe({
      next: (data) => {
        this.precios = data;
        this.preciosAutoservicio = data.filter(p => p.tipoServicio === 'Autoservicio');
        this.preciosServicioCompleto = data.filter(p => p.tipoServicio === 'Servicio Completo');
        this.cargando = false;
      },
      error: (err) => console.error('Error al cargar precios', err)
    });
  }
}
