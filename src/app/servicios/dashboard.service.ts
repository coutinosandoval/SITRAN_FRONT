import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResumen, PrecioCombustible } from '../modelos/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = 'https://localhost:7069/api/dashboard';

  constructor(private http: HttpClient) {}

  getResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.base}/resumen`);
  }

  getPreciosCombustible(): Observable<PrecioCombustible[]> {
    return this.http.get<PrecioCombustible[]>(`${this.base}/precios-combustible`);
  }
}
