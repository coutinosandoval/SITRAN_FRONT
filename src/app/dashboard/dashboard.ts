import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../servicios/dashboard.service';
import { DashboardResumen, PrecioCombustible } from '../modelos/dashboard.model';
import { environment } from '../../environments/environment';

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
    console.log('Dashboard iniciando...');
    this.cargarDatos();
  }

cargarDatos(): void {
  console.log('Cargando datos...');

  this.dashboardService.getResumen().subscribe({
    next: (data) => {
      console.log('Resumen completo:', JSON.stringify(data));
  this.resumen  = data;
  this.cargando = false;
    },
    error: (err) => {
      console.error('Error resumen:', err);
      this.cargando = false;
    }
  });

  this.dashboardService.getPreciosCombustible().subscribe({
    next: (data) => {
      this.precios                 = data;
      this.preciosAutoservicio     = data.filter(p => p.tipoServicio === 'Autoservicio');
      this.preciosServicioCompleto = data.filter(p => p.tipoServicio === 'Servicio Completo');
    },
    error: (err) => console.error('Error precios:', err)
  });

  
}
}